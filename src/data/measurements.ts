import type { TranslationKey } from '../i18n/ky';

export type MeasurementType = 'bloodPressure' | 'pulse' | 'spo2';

export type Measurement =
  | { id: string; type: 'bloodPressure'; systolic: number; diastolic: number; createdAt: number }
  | { id: string; type: 'pulse'; bpm: number; createdAt: number }
  | { id: string; type: 'spo2'; percent: number; createdAt: number };

export type Tone = 'danger' | 'warning' | 'success';

export const measurementMeta: Record<MeasurementType, { tone: Tone }> = {
  bloodPressure: { tone: 'danger' },
  pulse: { tone: 'warning' },
  spo2: { tone: 'success' },
};

export function formatMeasurementValue(measurement: Measurement): string {
  if (measurement.type === 'bloodPressure') return `${measurement.systolic}/${measurement.diastolic}`;
  if (measurement.type === 'pulse') return `${measurement.bpm}`;
  return `${measurement.percent}%`;
}

export function formatTime(createdAt: number): string {
  const date = new Date(createdAt);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDateGroup(createdAt: number, t: (key: TranslationKey) => string): string {
  const date = new Date(createdAt);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const monthKey = `month.${date.getMonth()}` as TranslationKey;
  const dateLabel = `${date.getDate()}-${t(monthKey)}`;

  if (isSameDay(date, today)) return `${t('date.today')}, ${dateLabel}`;
  if (isSameDay(date, yesterday)) return `${t('date.yesterday')}, ${dateLabel}`;
  return dateLabel;
}
