export type ReminderCategory = 'medicine' | 'measurement' | 'water' | 'exercise';

export type Reminder = {
  id: string;
  category: ReminderCategory;
  title: string;
  time: string;
  enabled: boolean;
  createdAt: number;
  notificationId: string | null;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}
