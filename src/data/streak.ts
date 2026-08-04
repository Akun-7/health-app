import type { Measurement } from './measurements';

export type StreakDay = {
  timestamp: number;
  active: boolean;
  dayOfWeek: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Last `days` calendar days (oldest first, today last), each marked active
// if at least one measurement was logged on that day.
export function computeStreakDays(measurements: Measurement[], now: number = Date.now(), days = 7): StreakDay[] {
  const todayStart = startOfDay(now);
  const activeDays = new Set(measurements.map((m) => startOfDay(m.createdAt)));

  const result: StreakDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const timestamp = todayStart - i * DAY_MS;
    result.push({ timestamp, active: activeDays.has(timestamp), dayOfWeek: new Date(timestamp).getDay() });
  }
  return result;
}
