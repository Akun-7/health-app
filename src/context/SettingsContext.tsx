import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'health-app/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

type Settings = {
  themeMode: ThemeMode;
};

const defaultSettings: Settings = { themeMode: 'system' };

type SettingsContextValue = {
  settings: Settings;
  loading: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      })
      .finally(() => setLoading(false));
  }, []);

  async function setThemeMode(themeMode: ThemeMode) {
    const next = { ...settings, themeMode };
    setSettings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const value = useMemo(() => ({ settings, loading, setThemeMode }), [settings, loading]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
