import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reminder, ReminderCategory } from '../data/reminders';
import {
  configureNotificationHandler,
  configureAdherenceCategory,
  scheduleReminderNotification,
  cancelReminderNotification,
} from '../notifications/reminderNotifications';
import { useLocale } from './LocaleContext';
import type { TranslationKey } from '../i18n/ky';

const STORAGE_KEY = 'health-app/reminders';

type NewReminder = {
  category: ReminderCategory;
  title: string;
  time: string;
};

type RemindersContextValue = {
  reminders: Reminder[];
  loading: boolean;
  addReminder: (input: NewReminder) => Promise<Reminder>;
  toggleReminder: (id: string, enabled: boolean) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    configureNotificationHandler();
    configureAdherenceCategory(t('reminder.taken'), t('reminder.skip'));
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setReminders(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: Reminder[]) {
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function notificationLabels(category: ReminderCategory) {
    return {
      categoryLabel: t(`reminder.${category}` as TranslationKey),
      channelName: t('reminder.channelName'),
    };
  }

  async function addReminder(input: NewReminder) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const notificationId = await scheduleReminderNotification({ ...input, id }, notificationLabels(input.category));
    const reminder: Reminder = {
      ...input,
      id,
      enabled: true,
      createdAt: Date.now(),
      notificationId,
    };
    await persist([reminder, ...reminders]);
    return reminder;
  }

  async function toggleReminder(id: string, enabled: boolean) {
    const target = reminders.find((r) => r.id === id);
    if (!target) return;

    let notificationId = target.notificationId;
    if (enabled) {
      notificationId = await scheduleReminderNotification(target, notificationLabels(target.category));
    } else {
      await cancelReminderNotification(target.notificationId);
      notificationId = null;
    }
    await persist(reminders.map((r) => (r.id === id ? { ...r, enabled, notificationId } : r)));
  }

  async function deleteReminder(id: string) {
    const target = reminders.find((r) => r.id === id);
    if (target) await cancelReminderNotification(target.notificationId);
    await persist(reminders.filter((r) => r.id !== id));
  }

  async function clearAll() {
    await Promise.all(reminders.map((r) => cancelReminderNotification(r.notificationId)));
    await persist([]);
  }

  const value = useMemo(
    () => ({ reminders, loading, addReminder, toggleReminder, deleteReminder, clearAll }),
    [reminders, loading]
  );

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useReminders(): RemindersContextValue {
  const ctx = useContext(RemindersContext);
  if (!ctx) {
    throw new Error('useReminders must be used within a RemindersProvider');
  }
  return ctx;
}
