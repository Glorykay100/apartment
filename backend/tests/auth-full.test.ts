import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { ensureConsent, getGuestId, getAdminId } from './helpers';

const auth = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: auth.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    if (token === 'test-admin-token')
      return { id: auth.adminId, email: 'admin@yahsab.com', role: 'ADMIN' as const, fullName: 'Glory Itodo' };
    return null;
  }),
}));

describe('Auth API — Supabase token verification & profile', () => {
  beforeAll(async () => {
    auth.guestId = await getGuestId();
    auth.adminId = await getAdminId();
    await ensureConsent(auth.guestId);
    await ensureConsent(auth.adminId);
  });

  describe('GET /api/v1/me', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
    });

    it('returns the guest profile with a valid guest token', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('guest@yahsab.com');
      expect(res.body.data.user.role).toBe('GUEST');
      expect(res.body.data).toHaveProperty('consent');
    });

    it('returns the admin profile with a valid admin token', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.data.user.role).toBe('ADMIN');
    });

    it('returns 401 for a forged token', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', 'Bearer forged-token');
      expect(res.status).toBe(401);
    });

    it('returns 401 for a missing Authorization header', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Authentication required');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns the same profile as /me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('guest@yahsab.com');
    });
  });

  describe('Legacy endpoints (410)', () => {
    it('POST /auth/register returns 410', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'new@test.com',
        password: 'Password1!',
      });
      expect(res.status).toBe(410);
      expect(res.body.message).toContain('Supabase');
    });

    it('POST /auth/login returns 410', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'guest@yahsab.com',
        password: 'anything',
      });
      expect(res.status).toBe(410);
    });

    it('POST /auth/forgot-password returns 410', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'guest@yahsab.com',
      });
      expect(res.status).toBe(410);
    });

    it('POST /auth/reset-password returns 410', async () => {
      const res = await request(app).post('/api/v1/auth/reset-password').send({
        token: 'abc',
        password: 'Password1!',
      });
      expect(res.status).toBe(410);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('returns 200 and clears the session', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('logged out');
    });
  });
});
