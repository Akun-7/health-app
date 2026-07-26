import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reminder, ReminderCategory } from '../data/reminders';
import {
  configureNotificationHandler,
  configureAdherenceCategory,
  scheduleReminderNotification,
  cancelReminderNotification,
} from '../notifications/reminderNotifications';
import { useLocale } from './LocaleContext';
import { useAuth } from './AuthContext';
import { fetchCloudReminders, syncCloudReminders } from '../api/client';
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
  const { token, loading: authLoading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const hasLocalRef = useRef(false);
  const syncedRef = useRef(false);

  function notificationLabels(category: ReminderCategory) {
    return {
      categoryLabel: t(`reminder.${category}` as TranslationKey),
      channelName: t('reminder.channelName'),
    };
  }

  async function persist(next: Reminder[]) {
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (token) syncCloudReminders(token, next).catch(() => {});
  }

  // Notification IDs are only valid on the device that scheduled them — a
  // reminder recovered from another phone needs to be rescheduled locally
  // before it can actually fire.
  async function rescheduleForThisDevice(remote: Reminder[]): Promise<Reminder[]> {
    return Promise.all(
      remote.map(async (reminder) => {
        if (!reminder.enabled) return { ...reminder, notificationId: null };
        const notificationId = await scheduleReminderNotification(reminder, notificationLabels(reminder.category));
        return { ...reminder, notificationId };
      })
    );
  }

  useEffect(() => {
    configureNotificationHandler();
    configureAdherenceCategory(t('reminder.taken'), t('reminder.skip'));
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          hasLocalRef.current = true;
          setReminders(JSON.parse(raw));
        }
      })
      .finally(() => setLocalReady(true));
  }, []);

  // Same reasoning as MeasurementsContext/ProfileContext: don't block the UI
  // if local data exists, but wait for the server on a fresh device (the
  // actual "phone lost" recovery case) — and reschedule notifications for
  // this device once recovered.
  useEffect(() => {
    if (!localReady || authLoading || syncedRef.current) return;
    syncedRef.current = true;

    if (hasLocalRef.current) {
      // This device already manages its own scheduled notifications —
      // treat local as authoritative and just push it up, rather than
      // pulling from remote. Adopting remote data means rescheduling every
      // notification (see rescheduleForThisDevice), which isn't safe to
      // repeat on every launch — the old notification would never get
      // cancelled, silently duplicating alerts over time.
      setLoading(false);
      if (!token) return;
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) syncCloudReminders(token, JSON.parse(raw)).catch(() => {});
      });
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }
    fetchCloudReminders(token)
      .then(async ({ reminders: remote }) => {
        if (remote.length > 0) {
          await persist(await rescheduleForThisDevice(remote));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localReady, authLoading, token]);

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
