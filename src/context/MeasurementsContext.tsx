import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Measurement } from '../data/measurements';

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
