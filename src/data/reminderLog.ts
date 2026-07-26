export type AdherenceStatus = 'taken' | 'skipped';

export type ReminderLogEntry = {
  id: string;
  reminderId: string;
  status: AdherenceStatus;
  at: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weeklyStats(log: ReminderLogEntry[], reminderId: string): { taken: number; total: number } {
  const cutoff = Date.now() - WEEK_MS;
  const entries = log.filter((e) => e.reminderId === reminderId && e.at >= cutoff);
  return { taken: entries.filter((e) => e.status === 'taken').length, total: entries.length };
}
