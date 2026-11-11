import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { BUSINESS_CONFIG } from '../src/config/business';
import { ensureConsent, getGuestId, getApartmentId, testEmail } from './helpers';

const auth = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: auth.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    if (token === 'test-fresh-noconsent')
      return { id: 'fresh-noconsent-id', email: 'fresh@test.com', role: 'GUEST' as const, fullName: 'Fresh' };
    return null;
  }),
}));

describe('Consent & Terms — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    await ensureConsent(auth.guestId);
    apartmentId = await getApartmentId();
  });

  describe('GET /api/v1/consent/terms-status', () => {
    it('requires authentication (401)', async () => {
      const res = await request(app).get('/api/v1/consent/terms-status');
      expect(res.status).toBe(401);
    });

    it('returns needsReaccept=false for a user with current consent', async () => {
      // Re-ensure consent records exist (they may have been cleaned by other tests)
      await ensureConsent(auth.guestId);
      const res = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.data.needsReaccept).toBe(false);
      expect(res.body.data.currentVersion).toBe(BUSINESS_CONFIG.termsVersion);
    });
  });

  describe('POST /api/v1/consent/accept', () => {
    it('requires authentication (401)', async () => {
      const res = await request(app).post('/api/v1/consent/accept').send({ documentType: 'terms' });
      expect(res.status).toBe(401);
    });

    it('records terms acceptance', async () => {
      const res = await request(app).post('/api/v1/consent/accept').set('Authorization', 'Bearer test-guest-token').send({ documentType: 'terms' });
      expect(res.status).toBe(201);
      expect(res.body.data.consent.documentType).toBe('terms');
      expect(res.body.data.consent.version).toBe(BUSINESS_CONFIG.termsVersion);
    });

    it('records privacy acceptance', async () => {
      const res = await request(app).post('/api/v1/consent/accept').set('Authorization', 'Bearer test-guest-token').send({ documentType: 'privacy' });
      expect(res.status).toBe(201);
    });

    it('records refund acceptance', async () => {
      const res = await request(app).post('/api/v1/consent/accept').set('Authorization', 'Bearer test-guest-token').send({ documentType: 'refund' });
      expect(res.status).toBe(201);
    });

    it('rejects invalid documentType (400)', async () => {
      const res = await request(app).post('/api/v1/consent/accept').set('Authorization', 'Bearer test-guest-token').send({ documentType: 'invalid' });
      expect(res.status).toBe(400);
    });

    it('updates marketing opt-in when provided', async () => {
      const res = await request(app).post('/api/v1/consent/accept').set('Authorization', 'Bearer test-guest-token').send({ documentType: 'terms', marketingOptIn: true });
      expect(res.status).toBe(201);
      const prefs = await prisma.emailPreferences.findUnique({ where: { userId: auth.guestId } });
      expect(prefs?.marketingOptIn).toBe(true);
    });
  });

  describe('Booking blocked until consent accepted (428)', () => {
    it('blocks booking creation without consent', async () => {
      const res = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-fresh-noconsent').send({
        apartmentId, checkIn: '2029-09-01', checkOut: '2029-09-04', guestCount: 1,
        guestFullName: 'Fresh', guestEmail: testEmail('qa-noconsent'), guestPhone: '+2348012345678',
      });
      expect(res.status).toBe(428);
    });

    it('blocks payment initialization without consent (428)', async () => {
      const res = await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-fresh-noconsent').send({ bookingReference: 'YAH-9999-XXXX' });
      expect(res.status).toBe(428);
    });
  });
});

describe('Terms re-acceptance after a termsVersion change', () => {
  let apartmentId: string;
  beforeAll(async () => {
    apartmentId = await getApartmentId();
  });
  const originalVersion = BUSINESS_CONFIG.termsVersion;
  const originalPrivacy = BUSINESS_CONFIG.privacyVersion;
  const originalRefund = BUSINESS_CONFIG.refundVersion;

  it('flags needsReaccept=true when the terms version is bumped, and clears after re-acceptance', async () => {
    await ensureConsent(auth.guestId);
    const before = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
    expect(before.body.data.needsReaccept).toBe(false);

    // Simulate a terms update
    (BUSINESS_CONFIG as any).termsVersion = '9.9-test';

    const during = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
    expect(during.status).toBe(200);
    expect(during.body.data.needsReaccept).toBe(true);
    expect(during.body.data.currentVersion).toBe('9.9-test');

    // Bookings are blocked until re-acceptance
    const blocked = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-guest-token')
      .send({
        apartmentId, checkIn: '2028-09-01', checkOut: '2028-09-04', guestCount: 1,
        guestFullName: 'Stale Consent', guestEmail: testEmail('qa-stale'), guestPhone: '+2348012345678',
      });
    expect(blocked.status).toBe(428);

    // Re-accept
    const accept = await request(app)
      .post('/api/v1/consent/accept')
      .set('Authorization', 'Bearer test-guest-token')
      .send({ documentType: 'terms' });
    expect(accept.status).toBe(201);
    expect(accept.body.data.consent.version).toBe('9.9-test');

    const after = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
    // Only terms was bumped — after re-accepting terms, the user is current again
    expect(after.body.data.needsReaccept).toBe(false);
    expect(after.body.data.acceptedVersion).toBe('9.9-test');
    const final = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
    expect(final.body.data.needsReaccept).toBe(false);

    // Booking works again after re-acceptance
    const unblocked = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', 'Bearer test-guest-token')
      .send({
        apartmentId, checkIn: '2028-09-01', checkOut: '2028-09-04', guestCount: 1,
        guestFullName: 'Fresh Consent', guestEmail: testEmail('qa-fresh-consent'), guestPhone: '+2348012345678',
      });
    expect(unblocked.status).toBe(201);
  });

  it('restores the original versions afterwards (cleanup)', async () => {
    (BUSINESS_CONFIG as any).termsVersion = originalVersion;
    (BUSINESS_CONFIG as any).privacyVersion = originalPrivacy;
    (BUSINESS_CONFIG as any).refundVersion = originalRefund;
    expect(BUSINESS_CONFIG.termsVersion).toBe(originalVersion);
    // Re-ensure current-version consent so later suites are unaffected
    await ensureConsent(auth.guestId);
    await prisma.user.update({
      where: { id: auth.guestId },
      data: { termsVersion: originalVersion, termsAcceptedAt: new Date() },
    });
    const status = await request(app).get('/api/v1/consent/terms-status').set('Authorization', 'Bearer test-guest-token');
    expect(status.body.data.needsReaccept).toBe(false);
  });
});
