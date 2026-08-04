import express from 'express';
import { listApprovedDoctors } from './userStore';
import { requireAuth } from './authMiddleware';

export function createDoctorsRouter() {
  const router = express.Router();
  router.use(requireAuth);

  router.get('/', (_req, res) => {
    const doctors = listApprovedDoctors().map((u) => ({ id: u.id, email: u.email }));
    res.json({ doctors });
  });

  return router;
}
