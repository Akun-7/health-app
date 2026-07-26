import type { SleepSample } from '../sleep/sleepSampling';

export type SleepSession = { start: number; end: number; durationMs: number };

const MIN_SESSION_MS = 3 * 60 * 60 * 1000; // shorter still-runs are more likely a nap or just sitting down
const MAX_GAP_MS = 45 * 60 * 1000; // tolerate a couple of missed background wakeups without splitting a session

function closeRun(sessions: SleepSession[], start: number | null, end: number | null) {
  if (start !== null && end !== null && end - start >= MIN_SESSION_MS) {
    sessions.push({ start, end, durationMs: end - start });
  }
}

export function inferSessions(samples: SleepSample[]): SleepSession[] {
  const sorted = [...samples].sort((a, b) => a.at - b.at);
  const sessions: SleepSession[] = [];
  let runStart: number | null = null;
  let lastStill: number | null = null;

  for (const sample of sorted) {
    if (!sample.still) {
      closeRun(sessions, runStart, lastStill);
      runStart = null;
      lastStill = null;
      continue;
    }
    if (runStart === null || (lastStill !== null && sample.at - lastStill > MAX_GAP_MS)) {
      closeRun(sessions, runStart, lastStill);
      runStart = sample.at;
    }
    lastStill = sample.at;
  }
  closeRun(sessions, runStart, lastStill);

  return sessions.sort((a, b) => b.end - a.end);
}

export function formatDurationParts(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
