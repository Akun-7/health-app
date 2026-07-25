import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createUser, findByEmail, findById } from './userStore';
import { signToken, verifyToken } from './auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function toPublicUser(user: { id: string; email: string }) {
  return { id: user.id, email: user.email };
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  (req as express.Request & { userId: string }).userId = userId;
  next();
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body ?? {};
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
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(email, passwordHash);
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
    const userId = (req as express.Request & { userId: string }).userId;
    const user = findById(userId);
    if (!user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  });

  return app;
}
