import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from './auth';

// Mirrors the dev-only fallback secret in auth.ts (used when JWT_SECRET is
// unset, which is the case in this test environment since NODE_ENV=test).
const DEV_SECRET = 'health-app-dev-secret-local-only';

describe('signToken / verifyToken', () => {
  test('a signed token verifies back to the same userId', () => {
    const token = signToken('user-123');
    expect(verifyToken(token)).toBe('user-123');
  });

  test('different userIds round-trip independently', () => {
    const tokenA = signToken('user-a');
    const tokenB = signToken('user-b');
    expect(verifyToken(tokenA)).toBe('user-a');
    expect(verifyToken(tokenB)).toBe('user-b');
  });

  test('garbage input is rejected', () => {
    expect(verifyToken('not-a-real-token')).toBeNull();
  });

  test('a token signed with a different secret is rejected', () => {
    const forged = jwt.sign({ sub: 'user-123' }, 'some-other-secret', { expiresIn: '30d' });
    expect(verifyToken(forged)).toBeNull();
  });

  test('an expired token is rejected', () => {
    const expired = jwt.sign({ sub: 'user-123' }, DEV_SECRET, { expiresIn: '-1s' });
    expect(verifyToken(expired)).toBeNull();
  });
});
