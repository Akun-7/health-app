import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup as apiSignup, login as apiLogin, fetchMe } from '../api/client';
import type { AuthUser } from '../api/client';

const STORAGE_KEY = 'health-app/authToken';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (token) => {
        if (!token) return;
        try {
          const { user: me } = await fetchMe(token);
          setUser(me);
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(token: string, nextUser: AuthUser) {
    await AsyncStorage.setItem(STORAGE_KEY, token);
    setUser(nextUser);
  }

  async function signup(email: string, password: string) {
    const { token, user: nextUser } = await apiSignup(email, password);
    await persist(token, nextUser);
  }

  async function login(email: string, password: string) {
    const { token, user: nextUser } = await apiLogin(email, password);
    await persist(token, nextUser);
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, signup, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
