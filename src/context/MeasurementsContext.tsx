import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../storage/secureStorage';
import type { Measurement } from '../data/measurements';
import { formatMeasurementValue } from '../data/measurements';
import { classify } from '../data/insights';
import { sendThresholdAlert } from '../notifications/thresholdAlerts';
import { useLocale } from './LocaleContext';
import { useAuth } from './AuthContext';
import { fetchCloudMeasurements, syncCloudMeasurements } from '../api/client';
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
  const { token, loading: authLoading } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const hasLocalRef = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          hasLocalRef.current = true;
          setMeasurements(JSON.parse(raw));
        }
      })
      .finally(() => setLocalReady(true));
  }, []);

  // Cloud sync: if this device already has local data, show it immediately
  // and reconcile with the server quietly. If local is empty, this could be
  // a fresh device recovering an account (phone-loss scenario) — wait for
  // the server response before deciding there's really nothing to show.
  useEffect(() => {
    if (!localReady || authLoading || syncedRef.current) return;
    syncedRef.current = true;

    if (hasLocalRef.current) {
      setLoading(false);
      if (!token) return;
      fetchCloudMeasurements(token)
        .then(({ measurements: remote }) => {
          if (remote.length > 0) {
            setMeasurements(remote);
            secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          } else {
            secureStorage.getItem(STORAGE_KEY).then((raw) => {
              if (raw) syncCloudMeasurements(token, JSON.parse(raw)).catch(() => {});
            });
          }
        })
        .catch(() => {});
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }
    fetchCloudMeasurements(token)
      .then(({ measurements: remote }) => {
        if (remote.length > 0) {
          setMeasurements(remote);
          secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localReady, authLoading, token]);

  async function persist(next: Measurement[]) {
    setMeasurements(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (token) syncCloudMeasurements(token, next).catch(() => {});
  }

  async function addMeasurement(input: NewMeasurement) {
    const measurement = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    } as Measurement;

    await persist([measurement, ...measurements]);

    if (classify(measurement) === 'concern') {
      const label = t(`measurement.${measurement.type}` as TranslationKey);
      const value = formatMeasurementValue(measurement);
      const advice = t('insights.status.concern');
      sendThresholdAlert(t('alert.title'), t('alert.body', { label, value, advice }), t('alert.channelName'));
    }
  }

  async function clearAll() {
    await persist([]);
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
