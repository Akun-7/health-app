import fs from 'fs';
import path from 'path';

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

const DB_PATH = path.join(__dirname, '..', 'data', 'users.json');

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

export function createUser(email: string, passwordHash: string): User {
  const users = load();
  const user: User = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    email,
    passwordHash,
    createdAt: Date.now(),
  };
  users.push(user);
  save(users);
  return user;
}
