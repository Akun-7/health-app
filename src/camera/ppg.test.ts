import { base64ToUint8Array, detectPeakIndices, estimateBpm } from './ppg';
import type { PpgSample } from './ppg';

describe('base64ToUint8Array', () => {
  it('decodes a base64 string back to its original bytes', () => {
    // "SGVsbG8=" is the base64 encoding of "Hello"
    const bytes = base64ToUint8Array('SGVsbG8=');
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it('decodes without padding just as well', () => {
    const bytes = base64ToUint8Array('SGVsbG8');
    expect(Array.from(bytes)).toEqual([72, 101, 108, 108, 111]);
  });

  it('returns an empty array for an empty string', () => {
    expect(base64ToUint8Array('').length).toBe(0);
  });
});

describe('detectPeakIndices', () => {
  it('finds simple local maxima', () => {
    const values = [0, 1, 0, 0, 1, 0, 0, 1, 0];
    expect(detectPeakIndices(values, 1)).toEqual([1, 4, 7]);
  });

  it('keeps the taller of two peaks closer together than minDistance', () => {
    const values = [0, 3, 0, 5, 0];
    expect(detectPeakIndices(values, 3)).toEqual([3]);
  });

  it('finds nothing on a flat signal', () => {
    expect(detectPeakIndices([1, 1, 1, 1, 1], 1)).toEqual([]);
  });
});

function syntheticPpgSamples(bpm: number, durationMs: number, sampleIntervalMs: number): PpgSample[] {
  const periodMs = 60000 / bpm;
  const samples: PpgSample[] = [];
  for (let t = 0; t <= durationMs; t += sampleIntervalMs) {
    // Slow linear drift on top of the periodic signal, to exercise detrending.
    const drift = t * 0.01;
    const value = Math.sin((2 * Math.PI * t) / periodMs) + drift;
    samples.push({ timestamp: t, value });
  }
  return samples;
}

describe('estimateBpm', () => {
  it('recovers the BPM of a clean synthetic 72bpm signal within a few bpm', () => {
    const samples = syntheticPpgSamples(72, 15000, 50);
    const bpm = estimateBpm(samples);
    expect(bpm).not.toBeNull();
    expect(Math.abs((bpm as number) - 72)).toBeLessThanOrEqual(3);
  });

  it('recovers the BPM of a clean synthetic 100bpm signal within a few bpm', () => {
    const samples = syntheticPpgSamples(100, 12000, 50);
    const bpm = estimateBpm(samples);
    expect(bpm).not.toBeNull();
    expect(Math.abs((bpm as number) - 100)).toBeLessThanOrEqual(3);
  });

  it('returns null when there are too few samples', () => {
    const samples: PpgSample[] = [
      { timestamp: 0, value: 1 },
      { timestamp: 100, value: 2 },
    ];
    expect(estimateBpm(samples)).toBeNull();
  });

  it('returns null for a flat signal with no discernible pulse', () => {
    const samples: PpgSample[] = Array.from({ length: 100 }, (_, i) => ({ timestamp: i * 50, value: 120 }));
    expect(estimateBpm(samples)).toBeNull();
  });
});
