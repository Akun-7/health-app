import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../storage/secureStorage';
import type { LabResult } from '../data/labResults';
import { useAuth } from './AuthContext';
import { fetchCloudLabResults, syncCloudLabResults } from '../api/client';

const STORAGE_KEY = 'health-app/labResults';

type NewLabResult = {
  name: string;
  value: string;
};

type LabResultsContextValue = {
  labResults: LabResult[];
  loading: boolean;
  addLabResult: (input: NewLabResult) => Promise<void>;
  deleteLabResult: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const LabResultsContext = createContext<LabResultsContextValue | null>(null);

export function LabResultsProvider({ children }: { children: React.ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const hasLocalRef = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          hasLocalRef.current = true;
          setLabResults(JSON.parse(raw));
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
      fetchCloudLabResults(token)
        .then(({ labResults: remote }) => {
          if (remote.length > 0) {
            setLabResults(remote);
            secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          } else {
            secureStorage.getItem(STORAGE_KEY).then((raw) => {
              if (raw) syncCloudLabResults(token, JSON.parse(raw)).catch(() => {});
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
    fetchCloudLabResults(token)
      .then(({ labResults: remote }) => {
        if (remote.length > 0) {
          setLabResults(remote);
          secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localReady, authLoading, token]);

  async function persist(next: LabResult[]) {
    setLabResults(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (token) syncCloudLabResults(token, next).catch(() => {});
  }

  async function addLabResult(input: NewLabResult) {
    const labResult: LabResult = {
      ...input,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    await persist([labResult, ...labResults]);
  }

  async function deleteLabResult(id: string) {
    await persist(labResults.filter((r) => r.id !== id));
  }

  async function clearAll() {
    await persist([]);
  }

  const value = useMemo(
    () => ({ labResults, loading, addLabResult, deleteLabResult, clearAll }),
    [labResults, loading]
  );

  return <LabResultsContext.Provider value={value}>{children}</LabResultsContext.Provider>;
}

export function useLabResults(): LabResultsContextValue {
  const ctx = useContext(LabResultsContext);
  if (!ctx) {
    throw new Error('useLabResults must be used within a LabResultsProvider');
  }
  return ctx;
}
