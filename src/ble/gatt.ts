// Bluetooth SIG стандарттуу GATT UUID'лары (medical health-device профилдери).
// Спецификация: Blood Pressure Service (0x1810), Pulse Oximeter Service (0x1822).
export const BLOOD_PRESSURE_SERVICE_UUID = '00001810-0000-1000-8000-00805f9b34fb';
export const BLOOD_PRESSURE_MEASUREMENT_UUID = '00002a35-0000-1000-8000-00805f9b34fb';
export const PULSE_OXIMETER_SERVICE_UUID = '00001822-0000-1000-8000-00805f9b34fb';
export const PLX_CONTINUOUS_MEASUREMENT_UUID = '00002a5f-0000-1000-8000-00805f9b34fb';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// IEEE-11073 16-bit SFLOAT: 4-bit signed exponent + 12-bit signed mantissa.
export function parseSFloat(bytes: Uint8Array, offset: number): number | null {
  const raw = bytes[offset] | (bytes[offset + 1] << 8);
  const mantissaRaw = raw & 0x0fff;
  const exponent = (raw >> 12) & 0xf;
  const signedExponent = exponent >= 8 ? exponent - 16 : exponent;
  const signedMantissa = mantissaRaw >= 0x0800 ? mantissaRaw - 0x1000 : mantissaRaw;
  if (mantissaRaw === 0x07ff) return null; // NaN
  return signedMantissa * Math.pow(10, signedExponent);
}

export type ParsedBloodPressure = { systolic: number; diastolic: number; pulse: number | null };

// Blood Pressure Measurement (0x2A35): flags(1) + systolic/diastolic/MAP (SFLOAT x3) + ...
export function parseBloodPressureMeasurement(base64Value: string): ParsedBloodPressure | null {
  const bytes = base64ToBytes(base64Value);
  if (bytes.length < 7) return null;
  const flags = bytes[0];
  const hasPulse = (flags & 0x04) !== 0;

  const systolic = parseSFloat(bytes, 1);
  const diastolic = parseSFloat(bytes, 3);
  if (systolic === null || diastolic === null) return null;

  let offset = 7; // after flags(1) + systolic/diastolic/MAP (2 each)
  if ((flags & 0x02) !== 0) offset += 7; // timestamp present (7 bytes)
  const pulse = hasPulse ? parseSFloat(bytes, offset) : null;

  return { systolic: Math.round(systolic), diastolic: Math.round(diastolic), pulse: pulse === null ? null : Math.round(pulse) };
}

export type ParsedPulseOximeter = { spo2: number; pulse: number | null };

// PLX Continuous Measurement (0x2A5F): flags(1) + SpO2 (SFLOAT) + pulse rate (SFLOAT) + ...
export function parsePulseOximeterMeasurement(base64Value: string): ParsedPulseOximeter | null {
  const bytes = base64ToBytes(base64Value);
  if (bytes.length < 5) return null;
  const spo2 = parseSFloat(bytes, 1);
  const pulse = parseSFloat(bytes, 3);
  if (spo2 === null) return null;
  return { spo2: Math.round(spo2), pulse: pulse === null ? null : Math.round(pulse) };
}
