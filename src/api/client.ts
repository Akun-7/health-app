import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 4000;

function resolveBaseUrl(): string {
  if (Platform.OS === 'web') return `http://localhost:${API_PORT}`;
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:${API_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

export type ApiErrorCode =
  | 'invalid_email'
  | 'invalid_password'
  | 'email_taken'
  | 'invalid_credentials'
  | 'unauthorized'
  | 'network_error';

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode) {
    super(code);
    this.code = code;
  }
}

async function request<T>(path: string, options?: { method?: string; body?: unknown; token?: string }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options?.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('network_error');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError((data.error as ApiErrorCode) ?? 'network_error');
  }
  return data as T;
}

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export function signup(email: string, password: string) {
  return request<AuthResponse>('/api/auth/signup', { method: 'POST', body: { email, password } });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function fetchMe(token: string) {
  return request<{ user: AuthUser }>('/api/auth/me', { token });
}
