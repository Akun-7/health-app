import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ky } from '../i18n/ky';
import type { TranslationKey } from '../i18n/ky';
import { ru } from '../i18n/ru';
import { en } from '../i18n/en';

const STORAGE_KEY = 'health-app/locale';

export type Locale = 'ky' | 'ru' | 'en';

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { ky, ru, en };

// Тил тандагычта ар бир тил өз энчилүү жазуусунда көрсөтүлөт
export const localeNativeName: Record<Locale, string> = {
  ky: 'Кыргызча',
  ru: 'Русский',
  en: 'English',
};

type LocaleContextValue = {
  locale: Locale;
  loading: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, token) => (token in params ? String(params[token]) : match));
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ky');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw === 'ky' || raw === 'ru' || raw === 'en') setLocaleState(raw);
      })
      .finally(() => setLoading(false));
  }, []);

  async function setLocale(next: Locale) {
    setLocaleState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      loading,
      setLocale,
      t: (key, params) => interpolate(dict[key], params),
    };
  }, [locale, loading]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}
