import { parseSFloat, parseBloodPressureMeasurement, parsePulseOximeterMeasurement } from './gatt';

function toBase64(bytes: number[]): string {
  return Buffer.from(bytes).toString('base64');
}

describe('parseSFloat', () => {
  test('zero', () => {
    expect(parseSFloat(new Uint8Array([0x00, 0x00]), 0)).toBe(0);
  });

  test('positive integer with exponent 0', () => {
    // mantissa 120, exponent 0 -> raw 0x0078 (little-endian: 0x78, 0x00)
    expect(parseSFloat(new Uint8Array([0x78, 0x00]), 0)).toBe(120);
  });

  test("negative mantissa (two's complement) with exponent 0", () => {
    // -5 as 12-bit two's complement = 0xFFB -> raw 0x0FFB (little-endian: 0xFB, 0x0F)
    expect(parseSFloat(new Uint8Array([0xfb, 0x0f]), 0)).toBe(-5);
  });

  test('applies a negative exponent (scales down)', () => {
    // mantissa 12, exponent -1 (stored nibble 15) -> raw 0xF00C (little-endian: 0x0C, 0xF0)
    // value = 12 * 10^-1 = 1.2
    expect(parseSFloat(new Uint8Array([0x0c, 0xf0]), 0)).toBeCloseTo(1.2);
  });

  test('applies a positive exponent combined with a negative mantissa', () => {
    // mantissa -12 (0xFF4), exponent 1 -> raw 0x1FF4 (little-endian: 0xF4, 0x1F)
    // value = -12 * 10^1 = -120
    expect(parseSFloat(new Uint8Array([0xf4, 0x1f]), 0)).toBe(-120);
  });

  test('the reserved mantissa 0x07FF is the NaN sentinel', () => {
    expect(parseSFloat(new Uint8Array([0xff, 0x07]), 0)).toBeNull();
  });

  test('reads from a non-zero offset inside a larger buffer', () => {
    const bytes = new Uint8Array([0xaa, 0xbb, 0x78, 0x00, 0xcc]);
    expect(parseSFloat(bytes, 2)).toBe(120);
  });
});

describe('parseBloodPressureMeasurement', () => {
  test('parses systolic/diastolic/pulse when the pulse flag is set', () => {
    // flags=0x04 (pulse present), systolic=120, diastolic=80, MAP=93, pulse=72
    const base64 = toBase64([0x04, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, 0x48, 0x00]);
    expect(parseBloodPressureMeasurement(base64)).toEqual({ systolic: 120, diastolic: 80, pulse: 72 });
  });

  test('pulse is null when the pulse flag is not set', () => {
    // flags=0x00, systolic=120, diastolic=80, MAP=93 — exactly the minimum 7 bytes
    const base64 = toBase64([0x00, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00]);
    expect(parseBloodPressureMeasurement(base64)).toEqual({ systolic: 120, diastolic: 80, pulse: null });
  });

  test('skips the optional 7-byte timestamp before reading pulse', () => {
    // flags=0x06 (timestamp + pulse), systolic=120, diastolic=80, MAP=93, timestamp(7 bytes, ignored), pulse=72
    const base64 = toBase64([
      0x06, 0x78, 0x00, 0x50, 0x00, 0x5d, 0x00, 0, 0, 0, 0, 0, 0, 0, 0x48, 0x00,
    ]);
    expect(parseBloodPressureMeasurement(base64)).toEqual({ systolic: 120, diastolic: 80, pulse: 72 });
  });

  test('returns null for a buffer shorter than the minimum 7 bytes', () => {
    const base64 = toBase64([0x00, 0x78, 0x00, 0x50, 0x00]);
    expect(parseBloodPressureMeasurement(base64)).toBeNull();
  });

  test('returns null when systolic is the NaN sentinel', () => {
    const base64 = toBase64([0x00, 0xff, 0x07, 0x50, 0x00, 0x5d, 0x00]);
    expect(parseBloodPressureMeasurement(base64)).toBeNull();
  });
});

describe('parsePulseOximeterMeasurement', () => {
  test('parses spo2 and pulse', () => {
    const base64 = toBase64([0x00, 0x62, 0x00, 0x48, 0x00]);
    expect(parsePulseOximeterMeasurement(base64)).toEqual({ spo2: 98, pulse: 72 });
  });

  test('returns null for a buffer shorter than the minimum 5 bytes', () => {
    const base64 = toBase64([0x00, 0x62, 0x00]);
    expect(parsePulseOximeterMeasurement(base64)).toBeNull();
  });

  test('returns null when spo2 is the NaN sentinel', () => {
    const base64 = toBase64([0x00, 0xff, 0x07, 0x48, 0x00]);
    expect(parsePulseOximeterMeasurement(base64)).toBeNull();
  });

  test('pulse is null (but spo2 still returned) when pulse is the NaN sentinel', () => {
    const base64 = toBase64([0x00, 0x62, 0x00, 0xff, 0x07]);
    expect(parsePulseOximeterMeasurement(base64)).toEqual({ spo2: 98, pulse: null });
  });
});
