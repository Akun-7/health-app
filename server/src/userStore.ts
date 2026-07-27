import fs from 'fs';
import path from 'path';
import { dataFilePath } from './dataDir';

export type UserRole = 'patient' | 'doctor';

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: number;
  resetCodeHash: string | null;
  resetCodeExpiresAt: number | null;
};

const DB_PATH = dataFilePath('users.json');

function load(): User[] {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(users: User[]) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

export function findByEmail(email: string): User | undefined {
  return load().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findById(id: string): User | undefined {
  return load().find((u) => u.id === id);
}

export function createUser(email: string, passwordHash: string, role: UserRole): User {
  const users = load();
  const user: User = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    email,
    passwordHash,
    role,
    createdAt: Date.now(),
    resetCodeHash: null,
    resetCodeExpiresAt: null,
  };
  users.push(user);
  save(users);
  return user;
}

export function setResetCode(userId: string, resetCodeHash: string, resetCodeExpiresAt: number) {
  const users = load();
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  user.resetCodeHash = resetCodeHash;
  user.resetCodeExpiresAt = resetCodeExpiresAt;
  save(users);
}

export function updatePassword(userId: string, passwordHash: string) {
  const users = load();
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  user.passwordHash = passwordHash;
  user.resetCodeHash = null;
  user.resetCodeExpiresAt = null;
  save(users);
}
