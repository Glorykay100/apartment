import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
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
      return { id: 'other-user-id', email: 'other@example.com', role: 'GUEST' as const, fullName: 'Other User' };
    if (token === 'test-fresh-noconsent')
      return { id: 'fresh-noconsent-id', email: 'fresh@test.com', role: 'GUEST' as const, fullName: 'Fresh' };
    return null;
  }),
}));

describe('Bookings API — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    await ensureConsent(auth.guestId);
    apartmentId = await getApartmentId();
  });

  beforeEach(async () => {
    await prisma.receipt.deleteMany({
      where: { booking: { apartmentId, guestEmail: { startsWith: 'qa-' } } },
    });
    await prisma.booking.deleteMany({
      where: { apartmentId, guestEmail: { startsWith: 'qa-' } },
    });
  });

  describe('POST /api/v1/bookings/calculate-quote', () => {
    it('calculates server-side quote with accurate fees', async () => {
      const res = await request(app).post('/api/v1/bookings/calculate-quote').send({
        apartmentId, checkIn: '2027-07-01', checkOut: '2027-07-04', guestCount: 2,
      });
      expect(res.status).toBe(200);
      const q = res.body.data.quote;
      expect(q.nights).toBe(3);
      expect(q.subtotal).toBe(q.nightlyRate * 3);
      expect(q.serviceFee).toBe(Math.round(q.subtotal * 0.05));
      expect(q.totalAmount).toBe(q.subtotal + q.cleaningFee + q.serviceFee);
    });

    it('rejects checkOut before checkIn (400)', async () => {
      const res = await request(app).post('/api/v1/bookings/calculate-quote').send({
        apartmentId, checkIn: '2027-07-10', checkOut: '2027-07-05', guestCount: 2,
      });
      expect(res.status).toBe(400);
    });

    it('rejects guest count exceeding max (400)', async () => {
      const res = await request(app).post('/api/v1/bookings/calculate-quote').send({
        apartmentId, checkIn: '2027-07-01', checkOut: '2027-07-03', guestCount: 99,
      });
      expect(res.status).toBe(400);
    });

    it('applies 10% discount for 7+ nights', async () => {
      const res = await request(app).post('/api/v1/bookings/calculate-quote').send({
        apartmentId, checkIn: '2027-08-01', checkOut: '2027-08-08', guestCount: 1,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.quote.discountPercent).toBe(10);
    });
  });

  describe('POST /api/v1/bookings', () => {
    it('requires authentication (401)', async () => {
      const res = await request(app).post('/api/v1/bookings').send({
        apartmentId, checkIn: '2027-09-01', checkOut: '2027-09-04', guestCount: 1,
        guestFullName: 'QA', guestEmail: testEmail('qa'), guestPhone: '+2348012345678',
      });
      expect(res.status).toBe(401);
    });

    it('creates a pending booking with server-calculated totals', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer test-guest-token')
        .send({
          apartmentId, checkIn: '2027-10-01', checkOut: '2027-10-04', guestCount: 2,
          guestFullName: 'QA Tester', guestEmail: testEmail('qa-booking'), guestPhone: '+2348012345678',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.booking.reference).toMatch(/^YAH-\d{4}-[A-Z0-9]{4}$/);
      expect(res.body.data.booking.status).toBe('PENDING');
      expect(res.body.data.booking.paymentStatus).toBe('UNPAID');
      expect(res.body.data.booking.nights).toBe(3);
      expect(res.body.data.booking.holdExpiresAt).toBeTruthy();
    });

    it('CRITICAL: ignores a tampered client total — server recalculates', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', 'Bearer test-guest-token')
        .send({
          apartmentId, checkIn: '2027-11-01', checkOut: '2027-11-04', guestCount: 2,
          guestFullName: 'Tampered', guestEmail: testEmail('qa-tampered'), guestPhone: '+2348012345678',
          totalAmount: 100,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.booking.totalAmount).toBeGreaterThan(100);
    });

    it('rejects overlapping dates (409)', async () => {
      const r1 = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2027-12-01', checkOut: '2027-12-05', guestCount: 1,
        guestFullName: 'First', guestEmail: testEmail('qa-overlap1'), guestPhone: '+2348012345678',
      });
      expect(r1.status).toBe(201);
      const r2 = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2027-12-03', checkOut: '2027-12-08', guestCount: 1,
        guestFullName: 'Second', guestEmail: testEmail('qa-overlap2'), guestPhone: '+2348012345678',
      });
      expect(r2.status).toBe(409);
    });

    it('rejects two SIMULTANEOUS requests for the same dates — exactly one wins', async () => {
      const payload = {
        apartmentId, checkIn: '2028-06-01', checkOut: '2028-06-05', guestCount: 1,
        guestPhone: '+2348012345678',
      };
      const [r1, r2] = await Promise.all([
        request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
          ...payload, guestFullName: 'Racer One', guestEmail: testEmail('qa-race1'),
        }),
        request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
          ...payload, guestFullName: 'Racer Two', guestEmail: testEmail('qa-race2'),
        }),
      ]);
      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([201, 409]);
      // The winner is a real pending booking; the loser created nothing
      const winners = [r1, r2].filter((r) => r.status === 201);
      expect(winners).toHaveLength(1);
      const persisted = await prisma.booking.count({
        where: { apartmentId, guestEmail: { contains: 'qa-race' } },
      });
      expect(persisted).toBe(1);
    });

    it('rejects booking on a blocked date (409)', async () => {
      await prisma.blockedDate.upsert({
        where: { apartmentId_date: { apartmentId, date: new Date('2028-01-15') } },
        update: { reason: 'Maintenance' },
        create: { apartmentId, date: new Date('2028-01-15'), reason: 'Maintenance' },
      });
      const res = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-01-14', checkOut: '2028-01-17', guestCount: 1,
        guestFullName: 'Blocked', guestEmail: testEmail('qa-blocked'), guestPhone: '+2348012345678',
      });
      expect(res.status).toBe(409);
      await prisma.blockedDate.deleteMany({ where: { apartmentId, date: new Date('2028-01-15') } });
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('requires authentication (401)', async () => {
      const res = await request(app).get('/api/v1/bookings/my-bookings');
      expect(res.status).toBe(401);
    });

    it('returns only the authenticated user\'s bookings', async () => {
      const res = await request(app).get('/api/v1/bookings/my-bookings').set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      for (const b of res.body.data.bookings) {
        expect(b.userId).toBe(auth.guestId);
      }
    });
  });

  describe('GET /api/v1/bookings/:reference', () => {
    it('returns 404 for non-existent booking', async () => {
      const res = await request(app).get('/api/v1/bookings/YAH-9999-XXXX').set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(404);
    });

    it('returns 403 when accessing another user\'s booking', async () => {
      const res = await request(app).get('/api/v1/bookings/YAH-2026-B9K1').set('Authorization', 'Bearer test-other-token');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/bookings/:id/cancel', () => {
    it('cancels a booking with non-refundable message', async () => {
      const createRes = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-03-01', checkOut: '2028-03-04', guestCount: 1,
        guestFullName: 'Cancel', guestEmail: testEmail('qa-cancel'), guestPhone: '+2348012345678',
      });
      expect(createRes.status).toBe(201);
      const res = await request(app).post(`/api/v1/bookings/${createRes.body.data.booking.id}/cancel`).set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('CANCELLED');
      expect(res.body.message).toContain('non-refundable');
    });

    it('cancelling a CONFIRMED (paid) booking states non-refundable and issues no refund', async () => {
      const createRes = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-07-01', checkOut: '2028-07-04', guestCount: 1,
        guestFullName: 'Paid Cancel', guestEmail: testEmail('qa-paid-cancel'), guestPhone: '+2348012345678',
      });
      expect(createRes.status).toBe(201);
      await prisma.booking.update({
        where: { id: createRes.body.data.booking.id },
        data: { status: 'CONFIRMED', paymentStatus: 'PAID', paystackReference: 'PSTK_paid_cancel_test' },
      });
      const res = await request(app).post(`/api/v1/bookings/${createRes.body.data.booking.id}/cancel`).set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('non-refundable');
      expect(res.body.data.booking.status).toBe('CANCELLED');
      // No refund: payment stays PAID
      expect(res.body.data.booking.paymentStatus).toBe('PAID');
      expect(res.body.data.refundPolicyNote).toMatch(/non-refundable/i);
      const refunded = await prisma.booking.findUniqueOrThrow({ where: { id: createRes.body.data.booking.id } });
      expect(refunded.paymentStatus).toBe('PAID');
    });

    it('returns 404 for non-existent booking', async () => {
      const res = await request(app).post('/api/v1/bookings/non-existent-id/cancel').set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(404);
    });

    it('returns 400 when cancelling an already-cancelled booking', async () => {
      const createRes = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-04-01', checkOut: '2028-04-04', guestCount: 1,
        guestFullName: 'Double Cancel', guestEmail: testEmail('qa-dbl-cancel'), guestPhone: '+2348012345678',
      });
      await request(app).post(`/api/v1/bookings/${createRes.body.data.booking.id}/cancel`).set('Authorization', 'Bearer test-guest-token');
      const res = await request(app).post(`/api/v1/bookings/${createRes.body.data.booking.id}/cancel`).set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(400);
    });
  });

  describe('Hold expiry', () => {
    it('expired hold releases dates — new booking succeeds', async () => {
      const createRes = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-05-01', checkOut: '2028-05-04', guestCount: 1,
        guestFullName: 'Hold', guestEmail: testEmail('qa-hold'), guestPhone: '+2348012345678',
      });
      expect(createRes.status).toBe(201);
      await prisma.booking.update({
        where: { id: createRes.body.data.booking.id },
        data: { holdExpiresAt: new Date(Date.now() - 1000) },
      });
      const res = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, checkIn: '2028-05-01', checkOut: '2028-05-04', guestCount: 1,
        guestFullName: 'After Expiry', guestEmail: testEmail('qa-after-expiry'), guestPhone: '+2348012345678',
      });
      expect(res.status).toBe(201);
    });
  });
});
