import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Measurement } from '../data/measurements';
import type { Profile } from '../data/profile';
import type { Reminder } from '../data/reminders';
import type { Medication } from '../data/medications';
import type { LabResult } from '../data/labResults';

const API_PORT = 4000;

// Production/EAS builds bake this in at build time (see .env / eas.json env)
// and it takes priority over the LAN-IP guess used for local dev.
const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL;

function resolveBaseUrl(): string {
  if (PRODUCTION_API_URL) return PRODUCTION_API_URL;
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
  | 'forbidden'
  | 'invalid_input'
  | 'invalid_reset_code'
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

export type UserRole = 'patient' | 'doctor';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type AuthUser = { id: string; email: string; role: UserRole; verificationStatus: VerificationStatus | null };
export type AuthResponse = { token: string; user: AuthUser };

export function signup(email: string, password: string, role: UserRole, licenseDocumentBase64?: string) {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: { email, password, role, licenseDocumentBase64 },
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function fetchMe(token: string) {
  return request<{ user: AuthUser }>('/api/auth/me', { token });
}

export function forgotPassword(email: string) {
  return request<{ ok: boolean }>('/api/auth/forgot-password', { method: 'POST', body: { email } });
}

export function resetPassword(email: string, code: string, newPassword: string) {
  return request<AuthResponse>('/api/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
  });
}

export type ChatMessage = {
  id: string;
  patientId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  createdAt: number;
};

export type ChatThread = {
  patientId: string;
  patientEmail: string;
  lastMessage: string;
  lastMessageAt: number;
};

export function fetchMyMessages(token: string) {
  return request<{ messages: ChatMessage[] }>('/api/chat/messages', { token });
}

export function sendMyMessage(token: string, text: string) {
  return request<{ message: ChatMessage }>('/api/chat/messages', { method: 'POST', body: { text }, token });
}

export function fetchThreads(token: string) {
  return request<{ threads: ChatThread[] }>('/api/chat/threads', { token });
}

export function fetchPatientMessages(token: string, patientId: string) {
  return request<{ messages: ChatMessage[] }>(`/api/chat/messages/${patientId}`, { token });
}

export function sendPatientMessage(token: string, patientId: string, text: string) {
  return request<{ message: ChatMessage }>(`/api/chat/messages/${patientId}`, {
    method: 'POST',
    body: { text },
    token,
  });
}

export function fetchCloudMeasurements(token: string) {
  return request<{ measurements: Measurement[] }>('/api/data/measurements', { token });
}

export function syncCloudMeasurements(token: string, measurements: Measurement[]) {
  return request<{ measurements: Measurement[] }>('/api/data/measurements', {
    method: 'PUT',
    body: { measurements },
    token,
  });
}

export function fetchCloudProfile(token: string) {
  return request<{ profile: Profile | null }>('/api/data/profile', { token });
}

export function syncCloudProfile(token: string, profile: Profile) {
  return request<{ profile: Profile | null }>('/api/data/profile', { method: 'PUT', body: { profile }, token });
}

export function fetchCloudReminders(token: string) {
  return request<{ reminders: Reminder[] }>('/api/data/reminders', { token });
}

export function syncCloudReminders(token: string, reminders: Reminder[]) {
  return request<{ reminders: Reminder[] }>('/api/data/reminders', {
    method: 'PUT',
    body: { reminders },
    token,
  });
}

export function fetchCloudMedications(token: string) {
  return request<{ medications: Medication[] }>('/api/data/medications', { token });
}

export function syncCloudMedications(token: string, medications: Medication[]) {
  return request<{ medications: Medication[] }>('/api/data/medications', {
    method: 'PUT',
    body: { medications },
    token,
  });
}

export function fetchCloudLabResults(token: string) {
  return request<{ labResults: LabResult[] }>('/api/data/labResults', { token });
}

export function syncCloudLabResults(token: string, labResults: LabResult[]) {
  return request<{ labResults: LabResult[] }>('/api/data/labResults', {
    method: 'PUT',
    body: { labResults },
    token,
  });
}

export type DoctorSummary = { id: string; email: string };

export function fetchDoctors(token: string) {
  return request<{ doctors: DoctorSummary[] }>('/api/doctors', { token });
}
