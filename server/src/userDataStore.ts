import fs from 'fs';
import path from 'path';
import { dataFilePath } from './dataDir';

// Opaque per-user data blobs — the server doesn't interpret these shapes,
// it just persists whatever the mobile app's contexts send it.
export type UserData = {
  measurements: unknown[];
  profile: unknown;
  reminders: unknown[];
};

const DB_PATH = dataFilePath('userData.json');
const EMPTY_USER_DATA: UserData = { measurements: [], profile: null, reminders: [] };

function load(): Record<string, UserData> {
  if (!fs.existsSync(DB_PATH)) return {};
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(all: Record<string, UserData>) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(all, null, 2));
}

export function getUserData(userId: string): UserData {
  return load()[userId] ?? EMPTY_USER_DATA;
}

export function setMeasurements(userId: string, measurements: unknown[]): unknown[] {
  const all = load();
  all[userId] = { ...(all[userId] ?? EMPTY_USER_DATA), measurements };
  save(all);
  return measurements;
}

export function setProfile(userId: string, profile: unknown): unknown {
  const all = load();
  all[userId] = { ...(all[userId] ?? EMPTY_USER_DATA), profile };
  save(all);
  return profile;
}

export function setReminders(userId: string, reminders: unknown[]): unknown[] {
  const all = load();
  all[userId] = { ...(all[userId] ?? EMPTY_USER_DATA), reminders };
  save(all);
  return reminders;
}
