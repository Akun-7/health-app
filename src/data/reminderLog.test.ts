import { weeklyStats } from './reminderLog';
import type { ReminderLogEntry } from './reminderLog';

const DAY = 24 * 60 * 60 * 1000;

function entry(reminderId: string, status: 'taken' | 'skipped', daysAgo: number): ReminderLogEntry {
  return { id: `${reminderId}-${daysAgo}`, reminderId, status, at: Date.now() - daysAgo * DAY };
}

describe('weeklyStats', () => {
  test('empty log yields zero taken and zero total', () => {
    expect(weeklyStats([], 'r1')).toEqual({ taken: 0, total: 0 });
  });

  test('counts taken vs total within the last 7 days', () => {
    const log: ReminderLogEntry[] = [
      entry('r1', 'taken', 1),
      entry('r1', 'taken', 2),
      entry('r1', 'skipped', 3),
    ];
    expect(weeklyStats(log, 'r1')).toEqual({ taken: 2, total: 3 });
  });

  test('ignores entries for a different reminderId', () => {
    const log: ReminderLogEntry[] = [entry('r1', 'taken', 1), entry('r2', 'taken', 1)];
    expect(weeklyStats(log, 'r1')).toEqual({ taken: 1, total: 1 });
  });

  test('excludes entries older than 7 days', () => {
    const log: ReminderLogEntry[] = [
      entry('r1', 'taken', 1),
      entry('r1', 'taken', 6.9),
      entry('r1', 'skipped', 8),
      entry('r1', 'taken', 30),
    ];
    expect(weeklyStats(log, 'r1')).toEqual({ taken: 2, total: 2 });
  });

  test('an entry from exactly now counts as within range', () => {
    const log: ReminderLogEntry[] = [{ id: 'x', reminderId: 'r1', status: 'taken', at: Date.now() }];
    expect(weeklyStats(log, 'r1')).toEqual({ taken: 1, total: 1 });
  });
});
