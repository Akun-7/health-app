import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../storage/secureStorage';
import type { Medication } from '../data/medications';
import { useAuth } from './AuthContext';
import { fetchCloudMedications, syncCloudMedications } from '../api/client';

const STORAGE_KEY = 'health-app/medications';

type NewMedication = {
  name: string;
  dosage: string;
};

type MedicationsContextValue = {
  medications: Medication[];
  loading: boolean;
  addMedication: (input: NewMedication) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const MedicationsContext = createContext<MedicationsContextValue | null>(null);

export function MedicationsProvider({ children }: { children: React.ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const hasLocalRef = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          hasLocalRef.current = true;
          setMedications(JSON.parse(raw));
        }
      })
      .finally(() => setLocalReady(true));
  }, []);

  // Same reasoning as MeasurementsContext: don't block the UI if local data
  // exists, but wait for the server on a fresh device (phone-loss recovery).
  useEffect(() => {
    if (!localReady || authLoading || syncedRef.current) return;
    syncedRef.current = true;

    if (hasLocalRef.current) {
      setLoading(false);
      if (!token) return;
      fetchCloudMedications(token)
        .then(({ medications: remote }) => {
          if (remote.length > 0) {
            setMedications(remote);
            secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          } else {
            secureStorage.getItem(STORAGE_KEY).then((raw) => {
              if (raw) syncCloudMedications(token, JSON.parse(raw)).catch(() => {});
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
    fetchCloudMedications(token)
      .then(({ medications: remote }) => {
        if (remote.length > 0) {
          setMedications(remote);
          secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localReady, authLoading, token]);

  async function persist(next: Medication[]) {
    setMedications(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (token) syncCloudMedications(token, next).catch(() => {});
  }

  async function addMedication(input: NewMedication) {
    const medication: Medication = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    await persist([medication, ...medications]);
  }

  async function deleteMedication(id: string) {
    await persist(medications.filter((m) => m.id !== id));
  }

  async function clearAll() {
    await persist([]);
  }

  const value = useMemo(
    () => ({ medications, loading, addMedication, deleteMedication, clearAll }),
    [medications, loading]
  );

  return <MedicationsContext.Provider value={value}>{children}</MedicationsContext.Provider>;
}

export function useMedications(): MedicationsContextValue {
  const ctx = useContext(MedicationsContext);
  if (!ctx) {
    throw new Error('useMedications must be used within a MedicationsProvider');
  }
  return ctx;
}
