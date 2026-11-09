import { beforeAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const secret = 'test-only-supabase-jwt-secret-that-is-long-enough';
let verifySupabaseClaims: (token: string) => Promise<{ sub: string } | null>;

beforeAll(async () => {
  vi.stubEnv('SUPABASE_URL', 'https://yahsab-test.supabase.co');
  vi.stubEnv('SUPABASE_JWT_SECRET', secret);
  vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
  ({ verifySupabaseClaims } = await import('../src/config/supabaseAuth'));
});

function token(overrides: Record<string, unknown> = {}, expiresIn: number | string = '5m') {
  return jwt.sign(
    { sub: 'supabase-user-id', role: 'authenticated', ...overrides },
    secret,
    { algorithm: 'HS256', issuer: 'https://yahsab-test.supabase.co/auth/v1', audience: 'authenticated', expiresIn } as jwt.SignOptions
  );
}

describe('Supabase JWT claim verification', () => {
  it('accepts a valid token with the expected issuer, audience and expiry', async () => {
    expect(await verifySupabaseClaims(token())).toEqual({ sub: 'supabase-user-id' });
  });

  it('rejects forged signatures', async () => {
    const valid = token();
    const forged = `${valid.slice(0, valid.lastIndexOf('.') + 1)}forged-signature`;
    await expect(verifySupabaseClaims(forged)).rejects.toThrow();
  });

  it('rejects expired tokens', async () => {
    await expect(verifySupabaseClaims(token({}, -60))).rejects.toThrow(/expired/i);
  });

  it('rejects tokens with the wrong audience', async () => {
    const invalidAudience = jwt.sign(
      { sub: 'supabase-user-id' }, secret,
      { algorithm: 'HS256', issuer: 'https://yahsab-test.supabase.co/auth/v1', audience: 'other', expiresIn: '5m' }
    );
    await expect(verifySupabaseClaims(invalidAudience)).rejects.toThrow(/audience/i);
  });
});
