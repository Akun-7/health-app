import express from 'express';
import { getUserData, setMeasurements, setProfile, setReminders } from './userDataStore';
import { requireAuth } from './authMiddleware';
import type { AuthedRequest } from './authMiddleware';

export function createDataRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/measurements', (req, res) => {
    res.json({ measurements: getUserData((req as AuthedRequest).userId).measurements });
  });

  router.put('/measurements', (req, res) => {
    const { measurements } = req.body ?? {};
    if (!Array.isArray(measurements)) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    res.json({ measurements: setMeasurements((req as AuthedRequest).userId, measurements) });
  });

  router.get('/profile', (req, res) => {
    res.json({ profile: getUserData((req as AuthedRequest).userId).profile });
  });

  router.put('/profile', (req, res) => {
    const { profile } = req.body ?? {};
    res.json({ profile: setProfile((req as AuthedRequest).userId, profile ?? null) });
  });

  router.get('/reminders', (req, res) => {
    res.json({ reminders: getUserData((req as AuthedRequest).userId).reminders });
  });

  router.put('/reminders', (req, res) => {
    const { reminders } = req.body ?? {};
    if (!Array.isArray(reminders)) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    res.json({ reminders: setReminders((req as AuthedRequest).userId, reminders) });
  });

  return router;
}
