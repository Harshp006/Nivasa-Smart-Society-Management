import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication & Security Utilities', () => {
  const secret = 'nivasa-test-jwt-secret-for-auth-token-tests';

  it('should hash and verify passwords using bcrypt', async () => {
    const password = 'SecretPassword@123';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);

    const isWrong = await bcrypt.compare('WrongPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('should generate and verify JWT access tokens', () => {
    const payload = { userId: 'user-cuid-1', role: 'ADMIN', email: 'admin@nivasa.com' };
    const token = jwt.sign(payload, secret, { expiresIn: '15m' });

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = jwt.verify(token, secret) as any;
    expect(decoded.userId).toBe('user-cuid-1');
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.email).toBe('admin@nivasa.com');
  });

  it('should reject invalid or expired JWT tokens', () => {
    const wrongSecret = 'wrong-secret-key';
    const token = jwt.sign({ userId: 'u-1' }, secret, { expiresIn: '1s' });

    expect(() => jwt.verify(token, wrongSecret)).toThrow();
  });
});
