import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { Accelerometer } from 'expo-sensors';

export const SLEEP_TASK_NAME = 'health-app-sleep-sample';
const SAMPLES_KEY = 'health-app/sleepSamples';
const MAX_SAMPLES = 3000;
const SAMPLE_WINDOW_MS = 2000;
const SAMPLE_INTERVAL_MS = 200; // Android 12+ minimum without extra permission

// Heuristic threshold on accelerometer-magnitude variance: near-motionless
// (phone resting on a nightstand/under a pillow) reads close to a constant
// ~1g, so variance stays very low. Never validated against a real sleep
// session — see CLAUDE.md's Bluetooth/sleep-tracking caveat.
const STILL_VARIANCE_THRESHOLD = 0.01;

export type SleepSample = { at: number; still: boolean };

export async function loadSamples(): Promise<SleepSample[]> {
  const raw = await AsyncStorage.getItem(SAMPLES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function appendSample(sample: SleepSample) {
  const samples = await loadSamples();
  const next = [...samples, sample].slice(-MAX_SAMPLES);
  await AsyncStorage.setItem(SAMPLES_KEY, JSON.stringify(next));
}

function measureStillness(): Promise<boolean> {
  return new Promise((resolve) => {
    const magnitudes: number[] = [];
    Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      magnitudes.push(Math.sqrt(x * x + y * y + z * z));
    });
    setTimeout(() => {
      subscription.remove();
      if (magnitudes.length < 2) {
        resolve(true); // not enough data — default to "still" rather than false-flagging motion
        return;
      }
      const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
      const variance = magnitudes.reduce((a, b) => a + (b - mean) ** 2, 0) / magnitudes.length;
      resolve(variance < STILL_VARIANCE_THRESHOLD);
    }, SAMPLE_WINDOW_MS);
  });
}

// Bypasses the background scheduler for immediate, on-demand testing (the
// scheduler itself can't be reliably triggered/observed within a single dev
// session — see SleepScreen's manual "check now" action).
export async function sampleNow(): Promise<SleepSample> {
  const still = await measureStillness();
  const sample: SleepSample = { at: Date.now(), still };
  await appendSample(sample);
  return sample;
}

if (Platform.OS !== 'web') {
  TaskManager.defineTask(SLEEP_TASK_NAME, async () => {
    try {
      await sampleNow();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerSleepTask() {
  if (Platform.OS === 'web') return;
  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(SLEEP_TASK_NAME);
  if (!alreadyRegistered) {
    await BackgroundTask.registerTaskAsync(SLEEP_TASK_NAME, { minimumInterval: 15 });
  }
}
