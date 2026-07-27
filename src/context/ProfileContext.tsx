import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { secureStorage } from '../storage/secureStorage';
import type { Profile } from '../data/profile';
import { useAuth } from './AuthContext';
import { fetchCloudProfile, syncCloudProfile } from '../api/client';

const STORAGE_KEY = 'health-app/profile';

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  saveProfile: (profile: Profile) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { token, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [localReady, setLocalReady] = useState(false);
  const hasLocalRef = useRef(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    secureStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          hasLocalRef.current = true;
          setProfile(JSON.parse(raw));
        }
      })
      .finally(() => setLocalReady(true));
  }, []);

  // Same reasoning as MeasurementsContext: don't block the UI on the network
  // if a local profile already exists, but do wait for the server on a
  // fresh device — that's the actual "phone lost" recovery case.
  useEffect(() => {
    if (!localReady || authLoading || syncedRef.current) return;
    syncedRef.current = true;

    if (hasLocalRef.current) {
      setLoading(false);
      if (!token) return;
      fetchCloudProfile(token)
        .then(({ profile: remote }) => {
          if (remote) {
            setProfile(remote);
            secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          } else {
            secureStorage.getItem(STORAGE_KEY).then((raw) => {
              if (raw) syncCloudProfile(token, JSON.parse(raw)).catch(() => {});
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
    fetchCloudProfile(token)
      .then(({ profile: remote }) => {
        if (remote) {
          setProfile(remote);
          secureStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [localReady, authLoading, token]);

  async function saveProfile(next: Profile) {
    setProfile(next);
    await secureStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (token) syncCloudProfile(token, next).catch(() => {});
  }

  const value = useMemo(() => ({ profile, loading, saveProfile }), [profile, loading]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
