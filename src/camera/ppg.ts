import { decode } from 'jpeg-js';

export type PpgSample = { timestamp: number; value: number };

const MIN_BPM = 40;
const MAX_BPM = 200;
const MIN_PEAKS = 4;

// atob() isn't guaranteed to exist in the Hermes/RN JS runtime, so base64 is
// decoded by hand rather than pulling in a polyfill.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// Average red-channel brightness across the whole frame — with a finger
// covering the lens+flash the frame is near-uniform, so a full-frame
// average is a reasonable proxy for a single-pixel PPG sensor.
export function averageRedBrightness(jpegBase64Data: string): number {
  const bytes = base64ToUint8Array(jpegBase64Data);
  const { data, width, height } = decode(bytes, { useTArray: true });
  const channels = data.length / (width * height);
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += channels) {
    sum += data[i];
    count += 1;
  }
  return count === 0 ? 0 : sum / count;
}

function movingAverage(values: number[], windowSize: number): number[] {
  const half = Math.floor(windowSize / 2);
  return values.map((_, i) => {
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end);
    return slice.reduce((sum, v) => sum + v, 0) / slice.length;
  });
}

// Local maxima at least `minDistance` samples apart; when two candidate
// peaks are closer than that, the taller one wins.
export function detectPeakIndices(values: number[], minDistance: number): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] > values[i - 1] && values[i] >= values[i + 1]) {
      const last = peaks[peaks.length - 1];
      if (last === undefined || i - last >= minDistance) {
        peaks.push(i);
      } else if (values[i] > values[last]) {
        peaks[peaks.length - 1] = i;
      }
    }
  }
  return peaks;
}

// Estimates BPM from a series of brightness samples via peak-to-peak
// interval timing. Returns null when the signal is too short or doesn't
// show a clear, physiologically plausible periodicity.
export function estimateBpm(samples: PpgSample[]): number | null {
  if (samples.length < 10) return null;

  const values = samples.map((s) => s.value);
  const trend = movingAverage(values, Math.max(5, Math.round(samples.length / 4)));
  const detrended = values.map((v, i) => v - trend[i]);

  const totalDurationMs = samples[samples.length - 1].timestamp - samples[0].timestamp;
  const avgSampleIntervalMs = totalDurationMs / (samples.length - 1);
  if (avgSampleIntervalMs <= 0) return null;
  const minDistanceSamples = Math.max(1, Math.round(60000 / MAX_BPM / avgSampleIntervalMs));

  const peakIndices = detectPeakIndices(detrended, minDistanceSamples);
  if (peakIndices.length < MIN_PEAKS) return null;

  const intervalsMs: number[] = [];
  for (let i = 1; i < peakIndices.length; i++) {
    intervalsMs.push(samples[peakIndices[i]].timestamp - samples[peakIndices[i - 1]].timestamp);
  }
  const avgIntervalMs = intervalsMs.reduce((sum, v) => sum + v, 0) / intervalsMs.length;
  const bpm = 60000 / avgIntervalMs;

  if (bpm < MIN_BPM || bpm > MAX_BPM) return null;
  return Math.round(bpm);
}
