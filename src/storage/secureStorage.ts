import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const KEY_NAME = 'health-app-encryption-key';
const ENC_PREFIX = 'enc1:';

let cachedKeyHex: string | null = null;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getOrCreateKeyHex(): Promise<string> {
  if (cachedKeyHex) return cachedKeyHex;
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) {
    cachedKeyHex = existing;
    return existing;
  }
  const keyHex = bytesToHex(await Crypto.getRandomBytesAsync(32));
  await SecureStore.setItemAsync(KEY_NAME, keyHex);
  cachedKeyHex = keyHex;
  return keyHex;
}

async function encrypt(plaintext: string): Promise<string> {
  const keyHex = await getOrCreateKeyHex();
  const ivHex = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const ciphertext = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Hex.parse(keyHex), {
    iv: CryptoJS.enc.Hex.parse(ivHex),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return `${ENC_PREFIX}${ivHex}:${ciphertext.toString()}`;
}

// Returns null on any failure (wrong key, corrupted payload) — callers
// should treat that the same as "no data" rather than crash.
async function decrypt(payload: string): Promise<string | null> {
  const [ivHex, ciphertextBase64] = payload.slice(ENC_PREFIX.length).split(':');
  if (!ivHex || !ciphertextBase64) return null;
  try {
    const keyHex = await getOrCreateKeyHex();
    const bytes = CryptoJS.AES.decrypt(ciphertextBase64, CryptoJS.enc.Hex.parse(keyHex), {
      iv: CryptoJS.enc.Hex.parse(ivHex),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const text = bytes.toString(CryptoJS.enc.Utf8);
    return text || null;
  } catch {
    return null;
  }
}

// Drop-in replacement for AsyncStorage's string API that encrypts values at
// rest using a key held in the OS keychain/keystore (expo-secure-store).
// Legacy plaintext values written before this existed are still readable
// (getItem falls back to returning them as-is) and get transparently
// re-encrypted on the next setItem.
//
// expo-secure-store has no web implementation (no OS keychain to back it),
// so on web this falls back to plain AsyncStorage — data stays unencrypted
// there. Web is used for local dev/testing, not the target patient platform.
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(key);
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    if (!raw.startsWith(ENC_PREFIX)) return raw;
    return decrypt(raw);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, await encrypt(value));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
