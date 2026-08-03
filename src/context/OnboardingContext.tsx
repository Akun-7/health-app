import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'health-app/onboardingSeen';

type OnboardingContextValue = {
  seen: boolean;
  loading: boolean;
  markSeen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setSeen(raw === 'true'))
      .finally(() => setLoading(false));
  }, []);

  async function markSeen() {
    setSeen(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }

  const value = useMemo(() => ({ seen, loading, markSeen }), [seen, loading]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
