import express from 'express';
import { verifyToken } from './auth';

export type AuthedRequest = express.Request & { userId: string };

export function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
}
