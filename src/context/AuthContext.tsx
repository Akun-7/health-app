import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup as apiSignup, login as apiLogin, fetchMe } from '../api/client';
import type { AuthUser, UserRole } from '../api/client';

const STORAGE_KEY = 'health-app/authToken';
const GUEST_MODE_KEY = 'health-app/guestMode';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  guestMode: boolean;
  signup: (email: string, password: string, role: UserRole, licenseDocumentBase64?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  applySession: (token: string, user: AuthUser) => Promise<void>;
  enterGuestMode: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).then(async (storedToken) => {
        if (!storedToken) return;
        try {
          const { user: me } = await fetchMe(storedToken);
          setUser(me);
          setToken(storedToken);
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }),
      AsyncStorage.getItem(GUEST_MODE_KEY).then((value) => setGuestMode(value === 'true')),
    ]).finally(() => setLoading(false));
  }, []);

  // A real signup/login always supersedes guest mode — otherwise logging out
  // of a real account later would silently fall back into guest mode instead
  // of showing Login, since the stale flag would still be in storage.
  async function persist(nextToken: string, nextUser: AuthUser) {
    await AsyncStorage.setItem(STORAGE_KEY, nextToken);
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setToken(nextToken);
    setUser(nextUser);
    setGuestMode(false);
  }

  async function enterGuestMode() {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setGuestMode(true);
  }

  async function signup(email: string, password: string, role: UserRole, licenseDocumentBase64?: string) {
    const { token: nextToken, user: nextUser } = await apiSignup(email, password, role, licenseDocumentBase64);
    await persist(nextToken, nextUser);
  }

  async function login(email: string, password: string) {
    const { token: nextToken, user: nextUser } = await apiLogin(email, password);
    await persist(nextToken, nextUser);
    return nextUser;
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  async function applySession(nextToken: string, nextUser: AuthUser) {
    await persist(nextToken, nextUser);
  }

  const value = useMemo(
    () => ({ user, token, loading, guestMode, signup, login, logout, applySession, enterGuestMode }),
    [user, token, loading, guestMode]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
