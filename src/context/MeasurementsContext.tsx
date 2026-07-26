import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Measurement } from '../data/measurements';
import { formatMeasurementValue } from '../data/measurements';
import { classify } from '../data/insights';
import { sendThresholdAlert } from '../notifications/thresholdAlerts';
import { useLocale } from './LocaleContext';
import type { TranslationKey } from '../i18n/ky';

const STORAGE_KEY = 'health-app/measurements';

type NewMeasurement =
  | { type: 'bloodPressure'; systolic: number; diastolic: number }
  | { type: 'pulse'; bpm: number }
  | { type: 'spo2'; percent: number };

type MeasurementsContextValue = {
  measurements: Measurement[];
  loading: boolean;
  addMeasurement: (input: NewMeasurement) => Promise<void>;
  clearAll: () => Promise<void>;
};

const MeasurementsContext = createContext<MeasurementsContextValue | null>(null);

export function MeasurementsProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setMeasurements(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  async function addMeasurement(input: NewMeasurement) {
    const measurement = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    } as Measurement;

    const next = [measurement, ...measurements];
    setMeasurements(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (classify(measurement) === 'concern') {
      const label = t(`measurement.${measurement.type}` as TranslationKey);
      const value = formatMeasurementValue(measurement);
      const advice = t('insights.status.concern');
      sendThresholdAlert(t('alert.title'), t('alert.body', { label, value, advice }), t('alert.channelName'));
    }
  }

  async function clearAll() {
    setMeasurements([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo(
    () => ({ measurements, loading, addMeasurement, clearAll }),
    [measurements, loading]
  );

  return <MeasurementsContext.Provider value={value}>{children}</MeasurementsContext.Provider>;
}

export function useMeasurements(): MeasurementsContextValue {
  const ctx = useContext(MeasurementsContext);
  if (!ctx) {
    throw new Error('useMeasurements must be used within a MeasurementsProvider');
  }
  return ctx;
}
