import express from 'express';
import { findById } from './userStore';
import { getMessagesForPatient, addMessage, getThreadSummaries } from './chatStore';
import { requireAuth } from './authMiddleware';
import type { AuthedRequest } from './authMiddleware';

function requireDoctor(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = findById((req as AuthedRequest).userId);
  if (!user || user.role !== 'doctor') {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
}

export function createChatRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/messages', (req, res) => {
    const userId = (req as AuthedRequest).userId;
    res.json({ messages: getMessagesForPatient(userId) });
  });

  router.post('/messages', (req, res) => {
    const userId = (req as AuthedRequest).userId;
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    const message = addMessage(userId, userId, 'patient', text.trim());
    res.status(201).json({ message });
  });

  router.get('/threads', requireDoctor, (_req, res) => {
    res.json({ threads: getThreadSummaries() });
  });

  router.get('/messages/:patientId', requireDoctor, (req, res) => {
    res.json({ messages: getMessagesForPatient(req.params.patientId) });
  });

  router.post('/messages/:patientId', requireDoctor, (req, res) => {
    const doctorId = (req as AuthedRequest).userId;
    const { text } = req.body ?? {};
    if (typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    const message = addMessage(req.params.patientId, doctorId, 'doctor', text.trim());
    res.status(201).json({ message });
  });

  return router;
}
