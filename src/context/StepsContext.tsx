import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import { todayKey, startOfToday } from '../data/steps';

const STORAGE_KEY = 'health-app/steps';

type StepsContextValue = {
  available: boolean;
  steps: number;
  loading: boolean;
};

const StepsContext = createContext<StepsContextValue | null>(null);

async function loadTodayTotal(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return 0;
  const stored = JSON.parse(raw) as { date: string; steps: number };
  return stored.date === todayKey() ? stored.steps : 0;
}

async function persistTodayTotal(steps: number) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), steps }));
}

export function StepsProvider({ children }: { children: React.ReactNode }) {
  const [available, setAvailable] = useState(false);
  const [steps, setSteps] = useState(0);
  const [loading, setLoading] = useState(true);
  // watchStepCount's callback reports a running delta since subscription
  // started, so we need the latest persisted total in a ref to add onto —
  // state alone would be stale inside the long-lived subscription closure.
  const totalRef = useRef(0);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setLoading(false);
      return;
    }

    let subscription: { remove: () => void } | null = null;

    async function setup() {
      const isAvailable = await Pedometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable) {
        setLoading(false);
        return;
      }

      const { status } = await Pedometer.requestPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      if (Platform.OS === 'ios') {
        const result = await Pedometer.getStepCountAsync(startOfToday(), new Date());
        setSteps(result.steps);
        setLoading(false);
        return;
      }

      // Android: no historical query API, so approximate "today's steps" by
      // accumulating watchStepCount's deltas onto a persisted running total.
      // This undercounts steps taken while the app wasn't open.
      totalRef.current = await loadTodayTotal();
      setSteps(totalRef.current);
      setLoading(false);
      subscription = Pedometer.watchStepCount((result) => {
        totalRef.current += result.steps;
        setSteps(totalRef.current);
        persistTodayTotal(totalRef.current);
      });
    }

    setup();
    return () => subscription?.remove();
  }, []);

  const value = useMemo(() => ({ available, steps, loading }), [available, steps, loading]);

  return <StepsContext.Provider value={value}>{children}</StepsContext.Provider>;
}

export function useSteps(): StepsContextValue {
  const ctx = useContext(StepsContext);
  if (!ctx) {
    throw new Error('useSteps must be used within a StepsProvider');
  }
  return ctx;
}
