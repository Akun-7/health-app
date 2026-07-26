import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createUser, findByEmail, findById } from './userStore';
import type { UserRole } from './userStore';
import { signToken } from './auth';
import { requireAuth } from './authMiddleware';
import type { AuthedRequest } from './authMiddleware';
import { createChatRouter } from './chatRoutes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function toPublicUser(user: { id: string; email: string; role: UserRole }) {
  return { id: user.id, email: user.email, role: user.role };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'invalid_email' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: 'invalid_password' });
      return;
    }
    if (findByEmail(email)) {
      res.status(409).json({ error: 'email_taken' });
      return;
    }
    const resolvedRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(email, passwordHash, resolvedRole);
    res.status(201).json({ token: signToken(user.id), user: toPublicUser(user) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = typeof email === 'string' ? findByEmail(email) : undefined;
    const valid = user && typeof password === 'string' && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !valid) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    res.json({ token: signToken(user.id), user: toPublicUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const user = findById(userId);
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  });

  app.use('/api/chat', createChatRouter());

  return app;
}
