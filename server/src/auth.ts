import jwt from 'jsonwebtoken';

// Dev-only local server — a fixed fallback secret is fine here since this
// never leaves the developer's machine. Override with JWT_SECRET if needed.
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
