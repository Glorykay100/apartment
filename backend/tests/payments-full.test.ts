import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { ensureConsent, getGuestId, getApartmentId, testEmail } from './helpers';

const auth = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: auth.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    if (token === 'test-admin-token')
      return { id: auth.adminId, email: 'admin@yahsab.com', role: 'ADMIN' as const, fullName: 'Glory Itodo' };
    if (token === 'test-other-token')
      return { id: 'other-user-id', email: 'other@example.com', role: 'GUEST' as const, fullName: 'Other' };
    return null;
  }),
}));

describe('Paystack payment — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    await ensureConsent(auth.guestId);
    apartmentId = await getApartmentId();
  });

  beforeEach(async () => {
    await prisma.webhookEvent.deleteMany({ where: { provider: 'paystack' } });
    await prisma.receipt.deleteMany({ where: { booking: { guestEmail: { contains: 'qa-pay' } } } });
    await prisma.booking.deleteMany({ where: { guestEmail: { contains: 'qa-pay' } } });
  });

  const createBooking = async (checkIn: string, checkOut: string) => {
    const res = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
      apartmentId, checkIn, checkOut, guestCount: 1,
      guestFullName: 'Paystack QA', guestEmail: testEmail('qa-pay'), guestPhone: '+2348012345678',
    });
    expect(res.status).toBe(201);
    return res.body.data.booking;
  };

  const buildWebhookEvent = (bookingRef: string, amountInKobo: number, channel = 'card', currency = 'NGN') => ({
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event: 'charge.success',
    data: {
      reference: `PSTK_${bookingRef}_${Date.now()}`,
      amount: amountInKobo, currency, channel,
      paid_at: new Date().toISOString(),
      metadata: { bookingReference: bookingRef },
    },
  });

  const postSignedWebhook = async (payload: object) => {
    const rawStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_1234567890').update(rawStr).digest('hex');
    return request(app).post('/api/v1/payments/webhook').set('x-paystack-signature', signature).set('Content-Type', 'application/json').send(rawStr);
  };

  describe('POST /api/v1/payments/initialize', () => {
    it('requires authentication (401)', async () => {
      const res = await request(app).post('/api/v1/payments/initialize').send({ bookingReference: 'YAH-9999-XXXX' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent booking', async () => {
      const res = await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-guest-token').send({ bookingReference: 'YAH-9999-XXXX' });
      expect(res.status).toBe(404);
    });

    it('initializes with unique reference per attempt', async () => {
      const booking = await createBooking('2029-01-10', '2029-01-13');
      const res1 = await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-guest-token').send({ bookingReference: booking.reference });
      expect(res1.status).toBe(200);
      expect(res1.body.data).toHaveProperty('authorization_url');
      expect(res1.body.data.reference).toContain(booking.reference);
      const res2 = await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-guest-token').send({ bookingReference: booking.reference });
      expect(res2.body.data.reference).not.toBe(res1.body.data.reference);
    });

    it('rejects initialization for another user\'s booking (403)', async () => {
      // The "other" user needs consent so we get past the consent check
      // and hit the ownership check (403)
      const otherUser = await prisma.user.upsert({
        where: { email: 'other@example.com' },
        update: {},
        create: { email: 'other@example.com', passwordHash: 'test', fullName: 'Other User', role: 'GUEST' },
      });
      await ensureConsent(otherUser.id);
      const booking = await createBooking('2029-02-10', '2029-02-13');
      // Override the mock for exactly the next verification (the initialize
      // request below) so the "other" user resolves to the real DB user.
      vi.mocked(await import('../src/config/supabaseAuth')).verifySupabaseToken.mockImplementationOnce(
        async (token: string) =>
          token === 'test-other-token'
            ? { id: otherUser.id, email: otherUser.email, role: 'GUEST' as any, fullName: otherUser.fullName }
            : null
      );
      const res = await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-other-token').send({ bookingReference: booking.reference });
      expect(res.status).toBe(403);
      await prisma.consentRecord.deleteMany({ where: { userId: otherUser.id } });
      await prisma.user.delete({ where: { id: otherUser.id } }).catch(() => {});
    });
  });

  describe('GET /api/v1/payments/verify/:reference', () => {
    it('verifies a payment and confirms booking', async () => {
      const booking = await createBooking('2029-03-10', '2029-03-13');
      await request(app).post('/api/v1/payments/initialize').set('Authorization', 'Bearer test-guest-token').send({ bookingReference: booking.reference });
      const res = await request(app).get(`/api/v1/payments/verify/${booking.reference}`).set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('CONFIRMED');
      expect(res.body.data.booking.paymentStatus).toBe('PAID');
    });
  });

  describe('Webhook', () => {
    it('rejects invalid signature (401)', async () => {
      const booking = await createBooking('2029-04-10', '2029-04-13');
      const payload = buildWebhookEvent(booking.reference, booking.totalAmount * 100);
      const res = await request(app).post('/api/v1/payments/webhook').set('x-paystack-signature', 'invalid').set('Content-Type', 'application/json').send(JSON.stringify(payload));
      expect(res.status).toBe(401);
    });

    it('rejects missing signature (401)', async () => {
      const res = await request(app).post('/api/v1/payments/webhook').set('Content-Type', 'application/json').send(JSON.stringify({ event: 'charge.success', data: {} }));
      expect(res.status).toBe(401);
    });

    it('confirms booking with correct amount (200)', async () => {
      const booking = await createBooking('2029-05-10', '2029-05-13');
      const res = await postSignedWebhook(buildWebhookEvent(booking.reference, booking.totalAmount * 100));
      expect(res.status).toBe(200);
      expect(res.text).toContain('Webhook processed');
      const confirmed = await prisma.booking.findUnique({ where: { reference: booking.reference } });
      expect(confirmed?.status).toBe('CONFIRMED');
      expect(confirmed?.paymentStatus).toBe('PAID');
    });

    it('is idempotent — duplicate webhook does not double-confirm', async () => {
      const booking = await createBooking('2029-06-10', '2029-06-13');
      const payload = buildWebhookEvent(booking.reference, booking.totalAmount * 100);
      const res1 = await postSignedWebhook(payload);
      expect(res1.status).toBe(200);
      const res2 = await postSignedWebhook(payload);
      expect(res2.status).toBe(200);
      expect(res2.text).toContain('already processed');
      const events = await prisma.webhookEvent.findMany({ where: { provider: 'paystack', reference: { contains: booking.reference } } });
      expect(events.length).toBe(1);
    });

    it('rejects amount mismatch — booking NOT confirmed', async () => {
      const booking = await createBooking('2029-07-10', '2029-07-13');
      const res = await postSignedWebhook(buildWebhookEvent(booking.reference, 100));
      expect(res.status).toBe(200);
      expect(res.text).toContain('amount mismatch');
      const b = await prisma.booking.findUnique({ where: { reference: booking.reference } });
      expect(b?.status).toBe('PENDING');
    });

    it('rejects currency mismatch — booking NOT confirmed', async () => {
      const booking = await createBooking('2029-08-10', '2029-08-13');
      const res = await postSignedWebhook(buildWebhookEvent(booking.reference, booking.totalAmount * 100, 'card', 'USD'));
      expect(res.status).toBe(200);
      expect(res.text).toContain('currency mismatch');
      const b = await prisma.booking.findUnique({ where: { reference: booking.reference } });
      expect(b?.status).toBe('PENDING');
    });

    it('handles charge.failed event', async () => {
      const payload = {
        id: `evt_failed_${Date.now()}`, event: 'charge.failed',
        data: { reference: `PSTK_FAIL_${Date.now()}`, amount: 50000, currency: 'NGN' },
      };
      const res = await postSignedWebhook(payload);
      expect(res.status).toBe(200);
    });

    it('handles abandoned payment event', async () => {
      const payload = {
        id: `evt_abandoned_${Date.now()}`, event: 'payment.authorization.abandoned',
        data: { reference: `PSTK_ABANDONED_${Date.now()}` },
      };
      const res = await postSignedWebhook(payload);
      expect(res.status).toBe(200);
    });
  });
});
