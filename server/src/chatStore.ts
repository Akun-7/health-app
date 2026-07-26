import fs from 'fs';
import path from 'path';
import { findById } from './userStore';
import type { UserRole } from './userStore';

export type Message = {
  id: string;
  patientId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  createdAt: number;
};

export type ThreadSummary = {
  patientId: string;
  patientEmail: string;
  lastMessage: string;
  lastMessageAt: number;
};

const DB_PATH = path.join(__dirname, '..', 'data', 'messages.json');

function load(): Message[] {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function save(messages: Message[]) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(messages, null, 2));
}

export function getMessagesForPatient(patientId: string): Message[] {
  return load()
    .filter((m) => m.patientId === patientId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function addMessage(patientId: string, senderId: string, senderRole: UserRole, text: string): Message {
  const messages = load();
  const message: Message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    patientId,
    senderId,
    senderRole,
    text,
    createdAt: Date.now(),
  };
  messages.push(message);
  save(messages);
  return message;
}

export function getThreadSummaries(): ThreadSummary[] {
  const messages = load();
  const byPatient = new Map<string, Message>();
  for (const message of messages) {
    const latest = byPatient.get(message.patientId);
    if (!latest || message.createdAt > latest.createdAt) {
      byPatient.set(message.patientId, message);
    }
  }
  return [...byPatient.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((m) => ({
      patientId: m.patientId,
      patientEmail: findById(m.patientId)?.email ?? m.patientId,
      lastMessage: m.text,
      lastMessageAt: m.createdAt,
    }));
}
