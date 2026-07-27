import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../storage/secureStorage';
import * as Notifications from 'expo-notifications';
import type { ReminderLogEntry, AdherenceStatus } from '../data/reminderLog';

const STORAGE_KEY = 'health-app/reminderLog';

type ReminderLogContextValue = {
  log: ReminderLogEntry[];
  loading: boolean;
  logEntry: (reminderId: string, status: AdherenceStatus) => Promise<void>;
  clearAll: () => Promise<void>;
};

const ReminderLogContext = createContext<ReminderLogContextValue | null>(null);

export function ReminderLogProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<ReminderLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // The notification-response listener below is registered once (mount-only
  // effect) and must never read a stale `log` snapshot from that render, so
  // writes always go through this ref instead of the closed-over state.
  const logRef = useRef<ReminderLogEntry[]>([]);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          logRef.current = parsed;
          setLog(parsed);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(next: ReminderLogEntry[]) {
    logRef.current = next;
    setLog(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function logEntry(reminderId: string, status: AdherenceStatus) {
    const entry: ReminderLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reminderId,
      status,
      at: Date.now(),
    };
    await persist([entry, ...logRef.current]);
  }

  // Lets the user tap "Taken"/"Skip" directly on a reminder notification
  // without opening the app — the actionIdentifier + reminderId (stashed in
  // the notification's data payload) tell us what to log.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const reminderId = response.notification.request.content.data?.reminderId;
      if (typeof reminderId !== 'string') return;
      if (response.actionIdentifier === 'taken') logEntry(reminderId, 'taken');
      else if (response.actionIdentifier === 'skip') logEntry(reminderId, 'skipped');
    });
    return () => subscription.remove();
  }, []);

  async function clearAll() {
    await persist([]);
  }

  const value = useMemo(() => ({ log, loading, logEntry, clearAll }), [log, loading]);

  return <ReminderLogContext.Provider value={value}>{children}</ReminderLogContext.Provider>;
}

export function useReminderLog(): ReminderLogContextValue {
  const ctx = useContext(ReminderLogContext);
  if (!ctx) {
    throw new Error('useReminderLog must be used within a ReminderLogProvider');
  }
  return ctx;
}
