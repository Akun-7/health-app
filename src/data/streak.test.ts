import { computeStreakDays } from './streak';
import type { Measurement } from './measurements';

function pulseAt(createdAt: number): Measurement {
  return { id: `${createdAt}`, type: 'pulse', bpm: 70, createdAt };
}

const DAY_MS = 24 * 60 * 60 * 1000;
// Fixed reference "now": 2026-08-04T12:00:00 local time.
const NOW = new Date(2026, 7, 4, 12, 0, 0).getTime();

describe('computeStreakDays', () => {
  it('returns 7 days by default, oldest first, ending on today', () => {
    const result = computeStreakDays([], NOW);
    expect(result).toHaveLength(7);
    expect(result[6].timestamp).toBe(new Date(2026, 7, 4, 0, 0, 0).getTime());
    expect(result[0].timestamp).toBe(new Date(2026, 7, -2, 0, 0, 0).getTime());
  });

  it('marks a day active when at least one measurement was logged that day', () => {
    const result = computeStreakDays([pulseAt(NOW)], NOW);
    expect(result[6].active).toBe(true);
    expect(result.slice(0, 6).every((d) => !d.active)).toBe(true);
  });

  it('counts multiple measurements on the same day as a single active day', () => {
    const result = computeStreakDays([pulseAt(NOW), pulseAt(NOW - 60_000), pulseAt(NOW - 120_000)], NOW);
    expect(result[6].active).toBe(true);
  });

  it('excludes measurements older than the requested window', () => {
    const eightDaysAgo = NOW - 8 * DAY_MS;
    const result = computeStreakDays([pulseAt(eightDaysAgo)], NOW);
    expect(result.every((d) => !d.active)).toBe(true);
  });

  it('marks yesterday active independently from today', () => {
    const yesterday = NOW - DAY_MS;
    const result = computeStreakDays([pulseAt(yesterday)], NOW);
    expect(result[5].active).toBe(true);
    expect(result[6].active).toBe(false);
  });

  it('supports a custom window size', () => {
    const result = computeStreakDays([], NOW, 3);
    expect(result).toHaveLength(3);
  });
});
