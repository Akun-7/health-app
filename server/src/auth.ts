import jwt from 'jsonwebtoken';

// The fixed fallback secret is only safe for local dev, where the server
// never leaves the developer's machine. Production deploys must set a real
// JWT_SECRET — we refuse to start rather than silently sign tokens with a
// secret that's public in this repo's history.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env variable is required when NODE_ENV=production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'health-app-dev-secret-local-only';
const TOKEN_TTL = '30d';

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}
