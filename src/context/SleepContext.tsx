import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { loadSamples, sampleNow, registerSleepTask } from '../sleep/sleepSampling';
import type { SleepSample } from '../sleep/sleepSampling';
import { inferSessions } from '../data/sleep';
import type { SleepSession } from '../data/sleep';

type SleepContextValue = {
  supported: boolean;
  loading: boolean;
  sessions: SleepSession[];
  sampleNowAndRefresh: () => Promise<SleepSample>;
};

const SleepContext = createContext<SleepContextValue | null>(null);

export function SleepProvider({ children }: { children: React.ReactNode }) {
  const supported = Platform.OS !== 'web';
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const samples = await loadSamples();
    setSessions(inferSessions(samples));
  }

  useEffect(() => {
    if (!supported) {
      setLoading(false);
      return;
    }
    registerSleepTask()
      .then(refresh)
      .finally(() => setLoading(false));
  }, [supported]);

  async function sampleNowAndRefresh() {
    const sample = await sampleNow();
    await refresh();
    return sample;
  }

  const value = useMemo(
    () => ({ supported, loading, sessions, sampleNowAndRefresh }),
    [supported, loading, sessions]
  );

  return <SleepContext.Provider value={value}>{children}</SleepContext.Provider>;
}

export function useSleep(): SleepContextValue {
  const ctx = useContext(SleepContext);
  if (!ctx) {
    throw new Error('useSleep must be used within a SleepProvider');
  }
  return ctx;
}
