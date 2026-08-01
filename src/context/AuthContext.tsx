import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup as apiSignup, login as apiLogin, fetchMe } from '../api/client';
import type { AuthUser, UserRole } from '../api/client';

const STORAGE_KEY = 'health-app/authToken';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signup: (email: string, password: string, role: UserRole, licenseDocumentBase64?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  applySession: (token: string, user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (storedToken) => {
        if (!storedToken) return;
        try {
          const { user: me } = await fetchMe(storedToken);
          setUser(me);
          setToken(storedToken);
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function persist(nextToken: string, nextUser: AuthUser) {
    await AsyncStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function signup(email: string, password: string, role: UserRole, licenseDocumentBase64?: string) {
    const { token: nextToken, user: nextUser } = await apiSignup(email, password, role, licenseDocumentBase64);
    await persist(nextToken, nextUser);
  }

  async function login(email: string, password: string) {
    const { token: nextToken, user: nextUser } = await apiLogin(email, password);
    await persist(nextToken, nextUser);
    return nextUser;
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  async function applySession(nextToken: string, nextUser: AuthUser) {
    await persist(nextToken, nextUser);
  }

  const value = useMemo(
    () => ({ user, token, loading, signup, login, logout, applySession }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
