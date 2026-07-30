import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { createUser, findByEmail, findById, setResetCode, updatePassword } from './userStore';
import type { UserRole, VerificationStatus } from './userStore';
import { signToken } from './auth';
import { requireAuth } from './authMiddleware';
import type { AuthedRequest } from './authMiddleware';
import { createChatRouter } from './chatRoutes';
import { createDataRouter } from './dataRoutes';
import { createAdminRouter } from './adminRoutes';
import { sendPasswordResetEmail } from './email';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const RESET_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const RESET_CODE_LENGTH = 8;
const RESET_CODE_TTL_MS = 60 * 60 * 1000;
// Generous enough for a photo of a document at reasonable JPEG quality, but
// still bounded — this is a JSON body, not a streamed upload.
const MAX_LICENSE_DOCUMENT_BASE64_LENGTH = 8 * 1024 * 1024;

function generateResetCode(): string {
  const bytes = crypto.randomBytes(RESET_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < RESET_CODE_LENGTH; i++) {
    code += RESET_CODE_ALPHABET[bytes[i] % RESET_CODE_ALPHABET.length];
  }
  return code;
}

function hashResetCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function toPublicUser(user: {
  id: string;
  email: string;
  role: UserRole;
  verificationStatus?: VerificationStatus | null;
}) {
  return { id: user.id, email: user.email, role: user.role, verificationStatus: user.verificationStatus ?? null };
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, role, licenseDocumentBase64 } = req.body ?? {};
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'invalid_email' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: 'invalid_password' });
      return;
    }
    const resolvedRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
    if (resolvedRole === 'doctor') {
      if (
        typeof licenseDocumentBase64 !== 'string' ||
        licenseDocumentBase64.length === 0 ||
        licenseDocumentBase64.length > MAX_LICENSE_DOCUMENT_BASE64_LENGTH
      ) {
        res.status(400).json({ error: 'invalid_input' });
        return;
      }
    }
    if (findByEmail(email)) {
      res.status(409).json({ error: 'email_taken' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser(email, passwordHash, resolvedRole, resolvedRole === 'doctor' ? licenseDocumentBase64 : null);
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

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body ?? {};
    const user = typeof email === 'string' ? findByEmail(email) : undefined;
    // Always respond the same way regardless of whether the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    if (user) {
      const code = generateResetCode();
      setResetCode(user.id, hashResetCode(code), Date.now() + RESET_CODE_TTL_MS);
      try {
        await sendPasswordResetEmail(user.email, code);
      } catch {
        // Swallow — we still respond ok so the response shape can't reveal
        // whether the account exists or whether delivery succeeded.
      }
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body ?? {};
    if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: 'invalid_password' });
      return;
    }
    const user = typeof email === 'string' ? findByEmail(email) : undefined;
    const validCode =
      user &&
      typeof code === 'string' &&
      user.resetCodeHash &&
      user.resetCodeExpiresAt &&
      user.resetCodeExpiresAt > Date.now() &&
      user.resetCodeHash === hashResetCode(code.trim().toUpperCase());
    if (!user || !validCode) {
      res.status(400).json({ error: 'invalid_reset_code' });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    updatePassword(user.id, passwordHash);
    res.json({ token: signToken(user.id), user: toPublicUser(user) });
  });

  app.use('/api/chat', createChatRouter());
  app.use('/api/data', createDataRouter());
  app.use(createAdminRouter());

  return app;
}
