import { beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticate, requireAdmin, requireCurrentConsent } from '../src/middleware/auth';
import { getBookingByReference } from '../src/controllers/booking.controller';
import { findOrCreateUserFromSupabase } from '../src/config/supabaseAuth';
import { BUSINESS_CONFIG } from '../src/config/business';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  bookingFindUnique: vi.fn(),
  consentFindMany: vi.fn(),
}));

vi.mock('../src/config/supabaseAuth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/config/supabaseAuth')>();
  return { ...actual, verifySupabaseToken: mocks.verify };
});
vi.mock('../src/config/db', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, findFirst: mocks.userFindFirst, create: mocks.userCreate, update: mocks.userUpdate },
    booking: { findUnique: mocks.bookingFindUnique },
    consentRecord: { findMany: mocks.consentFindMany },
  },
}));
vi.mock('../src/services/email.service', () => ({ sendWelcomeEmailOnce: vi.fn() }));

const app = express();
app.get('/private', authenticate, (req, res) => res.json({ user: req.user }));
app.get('/admin', authenticate, requireAdmin, (_req, res) => res.sendStatus(204));
app.get('/booking/:reference', authenticate, getBookingByReference);
app.post('/book', authenticate, requireCurrentConsent, (_req, res) => res.sendStatus(201));

const guest = { id: 'guest-2', email: 'guest@example.com', role: 'GUEST' as const, fullName: 'Guest Two' };
const admin = { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' as const, fullName: 'Admin' };

describe('Supabase authentication and authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verify.mockImplementation(async (token: string) => token === 'valid-guest' ? guest : token === 'valid-admin' ? admin : null);
    mocks.consentFindMany.mockResolvedValue([]);
  });

  it.each(['forged', 'expired'])('rejects %s tokens', async (token) => {
    const response = await request(app).get('/private').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(401);
  });

  it('rejects a missing token', async () => {
    expect((await request(app).get('/private')).status).toBe(401);
  });

  it('rejects non-admin users from admin routes', async () => {
    expect((await request(app).get('/admin').set('Authorization', 'Bearer valid-guest')).status).toBe(403);
    expect((await request(app).get('/admin').set('Authorization', 'Bearer valid-admin')).status).toBe(204);
  });

  it('does not return another user’s booking or embedded receipt', async () => {
    mocks.bookingFindUnique.mockResolvedValue({ id: 'booking-1', reference: 'BOOK-1', userId: 'different-user', receipt: { receiptNumber: 'RCT-1' } });
    const response = await request(app).get('/booking/BOOK-1').set('Authorization', 'Bearer valid-guest');
    expect(response.status).toBe(403);
    expect(response.body.data).toBeUndefined();
  });

  it('blocks booking until current terms, privacy and refund consent are recorded', async () => {
    const headers = { Authorization: 'Bearer valid-guest' };
    expect((await request(app).post('/book').set(headers)).status).toBe(428);
    mocks.consentFindMany.mockResolvedValue([
      { documentType: 'terms', version: BUSINESS_CONFIG.termsVersion },
      { documentType: 'privacy', version: BUSINESS_CONFIG.privacyVersion },
      { documentType: 'refund', version: BUSINESS_CONFIG.refundVersion },
    ]);
    expect((await request(app).post('/book').set(headers)).status).toBe(201);
  });

  it('creates a guest profile idempotently with marketing opt-in disabled', async () => {
    const created = { id: 'new-user', email: 'new@example.com', fullName: 'New Guest', role: 'GUEST', avatarUrl: null, emailVerified: true, authProvider: 'google' };
    mocks.userFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(created);
    mocks.userFindFirst.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue(created);
    const input = { supabaseUserId: 'supabase-id', email: 'new@example.com', emailVerified: true, fullName: 'New Guest', avatarUrl: null, provider: 'google' };
    expect((await findOrCreateUserFromSupabase(input)).created).toBe(true);
    expect(mocks.userCreate.mock.calls[0][0].data.emailPreferences.create.marketingOptIn).toBe(false);
    expect((await findOrCreateUserFromSupabase(input)).created).toBe(false);
    expect(mocks.userCreate).toHaveBeenCalledTimes(1);
  });

  it('links a verified same-email Supabase account to the existing user row', async () => {
    const existing = { id: 'existing-user', email: 'legacy@example.com', avatarUrl: null, role: 'ADMIN' };
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userFindFirst.mockResolvedValue(existing);
    mocks.userUpdate.mockResolvedValue({ ...existing, supabaseUserId: 'supabase-id' });
    const result = await findOrCreateUserFromSupabase({ supabaseUserId: 'supabase-id', email: 'legacy@example.com', emailVerified: true, fullName: 'Legacy Admin', avatarUrl: null, provider: 'google' });
    expect(result.user?.id).toBe('existing-user');
    expect(result.user?.role).toBe('ADMIN');
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.userUpdate.mock.calls[0][0].data.supabaseUserId).toBe('supabase-id');
  });
});
