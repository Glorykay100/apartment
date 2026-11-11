import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { ensureConsent, getGuestId, getAdminId, getApartmentId } from './helpers';

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

describe('Reviews, Contact, Admin & Security — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    auth.adminId = await getAdminId();
    await ensureConsent(auth.guestId);
    apartmentId = await getApartmentId();
  });

  // ─── Reviews ──────────────────────────────────────────────────

  describe('Reviews', () => {
    it('requires authentication to submit (401)', async () => {
      const res = await request(app).post('/api/v1/reviews/booking-123').send({
        rating: 5, cleanliness: 5, accuracy: 5, location: 5, value: 5, comment: 'Great stay',
      });
      expect(res.status).toBe(401);
    });

    it('rejects review for non-existent booking (404)', async () => {
      const res = await request(app).post('/api/v1/reviews/non-existent-booking').set('Authorization', 'Bearer test-guest-token').send({
        rating: 5, cleanliness: 5, accuracy: 5, location: 5, value: 5, comment: 'Great stay overall',
      });
      expect(res.status).toBe(404);
    });

    it('rejects review with invalid rating (400)', async () => {
      const res = await request(app).post('/api/v1/reviews/some-id').set('Authorization', 'Bearer test-guest-token').send({
        rating: 10, cleanliness: 5, accuracy: 5, location: 5, value: 5, comment: 'Too high rating',
      });
      expect(res.status).toBe(400);
    });

    it('rejects review with short comment (400)', async () => {
      const res = await request(app).post('/api/v1/reviews/some-id').set('Authorization', 'Bearer test-guest-token').send({
        rating: 5, cleanliness: 5, accuracy: 5, location: 5, value: 5, comment: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('allows review for a completed stay by the booking owner', async () => {
      const booking = await prisma.booking.create({
        data: {
          reference: 'YAH-QA-REV01', apartmentId, userId: auth.guestId,
          guestFullName: 'Review Tester', guestEmail: 'qa-review@test.com', guestPhone: '+2348012345678',
          checkIn: new Date('2026-01-01'), checkOut: new Date('2026-01-04'),
          nights: 3, guestCount: 2, nightlyRate: 50000, subtotal: 150000,
          cleaningFee: 5000, serviceFee: 7500, totalAmount: 162500,
          status: 'CONFIRMED', paymentStatus: 'PAID', paystackReference: 'PSTK_QA_REV01',
        },
      });
      const res = await request(app).post(`/api/v1/reviews/${booking.id}`).set('Authorization', 'Bearer test-guest-token').send({
        rating: 4, cleanliness: 4, accuracy: 5, location: 4, value: 4,
        comment: 'Lovely apartment, would stay again. Clean and well located.',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.review.rating).toBe(4);
      await prisma.review.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.deleteMany({ where: { id: booking.id } });
    });

    it('rejects a second review for the same booking (409)', async () => {
      const booking = await prisma.booking.create({
        data: {
          reference: 'YAH-QA-REV02', apartmentId, userId: auth.guestId,
          guestFullName: 'Double Review', guestEmail: 'qa-dbl-review@test.com', guestPhone: '+2348012345678',
          checkIn: new Date('2026-02-01'), checkOut: new Date('2026-02-04'),
          nights: 3, guestCount: 2, nightlyRate: 50000, subtotal: 150000,
          cleaningFee: 5000, serviceFee: 7500, totalAmount: 162500,
          status: 'CONFIRMED', paymentStatus: 'PAID', paystackReference: 'PSTK_QA_REV02',
        },
      });
      const res1 = await request(app).post(`/api/v1/reviews/${booking.id}`).set('Authorization', 'Bearer test-guest-token').send({
        rating: 5, cleanliness: 5, accuracy: 5, location: 5, value: 5, comment: 'First review, excellent stay.',
      });
      expect(res1.status).toBe(201);
      const res2 = await request(app).post(`/api/v1/reviews/${booking.id}`).set('Authorization', 'Bearer test-guest-token').send({
        rating: 4, cleanliness: 4, accuracy: 4, location: 4, value: 4, comment: 'Second review, should fail.',
      });
      expect(res2.status).toBe(409);
      await prisma.review.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.deleteMany({ where: { id: booking.id } });
    });
  });

  // ─── Contact ──────────────────────────────────────────────────

  describe('Contact form', () => {
    it('stores a contact message (201)', async () => {
      const res = await request(app).post('/api/v1/contact').send({
        name: 'QA Contact', email: 'qa-contact@test.com', phone: '+2348012345678',
        subject: 'Test inquiry', message: 'This is a test message for the contact form validation.',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('messageId');
    });

    it('rejects invalid email (400)', async () => {
      const res = await request(app).post('/api/v1/contact').send({
        name: 'QA', email: 'not-an-email', subject: 'Test', message: 'A valid message here.',
      });
      expect(res.status).toBe(400);
    });

    it('rejects short message (400)', async () => {
      const res = await request(app).post('/api/v1/contact').send({
        name: 'QA', email: 'test@test.com', subject: 'Test', message: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('rejects missing name (400)', async () => {
      const res = await request(app).post('/api/v1/contact').send({
        email: 'test@test.com', subject: 'Test', message: 'A valid message here.',
      });
      expect(res.status).toBe(400);
    });
  });

  // ─── Admin dashboard ──────────────────────────────────────────

  describe('Admin dashboard', () => {
    it('rejects unauthenticated access (401)', async () => {
      const res = await request(app).get('/api/v1/admin/stats');
      expect(res.status).toBe(401);
    });

    it('rejects guest access (403)', async () => {
      const res = await request(app).get('/api/v1/admin/stats').set('Authorization', 'Bearer test-guest-token');
      expect(res.status).toBe(403);
    });

    it('returns dashboard stats for admin', async () => {
      const res = await request(app).get('/api/v1/admin/stats').set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.data.stats).toHaveProperty('totalApartments');
      expect(res.body.data.stats).toHaveProperty('totalBookings');
      expect(res.body.data.stats).toHaveProperty('totalRevenue');
    });

    it('returns bookings list for admin', async () => {
      const res = await request(app).get('/api/v1/admin/bookings').set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.bookings)).toBe(true);
    });

    it('returns contact messages for admin', async () => {
      const res = await request(app).get('/api/v1/admin/contact-messages').set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });
  });

  // ─── Manual date blocking ─────────────────────────────────────

  describe('Manual date blocking', () => {
    const testDate = '2028-06-15';

    afterEach(async () => {
      await prisma.blockedDate.deleteMany({ where: { apartmentId, date: new Date(testDate) } });
    });

    it('admin can block a date (201)', async () => {
      const res = await request(app).post('/api/v1/admin/block-date').set('Authorization', 'Bearer test-admin-token').send({
        apartmentId, date: testDate, reason: 'Maintenance',
      });
      expect(res.status).toBe(201);
      expect(res.body.data.blocked.reason).toBe('Maintenance');
    });

    it('rejects guest from blocking a date (403)', async () => {
      const res = await request(app).post('/api/v1/admin/block-date').set('Authorization', 'Bearer test-guest-token').send({
        apartmentId, date: testDate,
      });
      expect(res.status).toBe(403);
    });

    it('admin can unblock a date', async () => {
      const blockRes = await request(app).post('/api/v1/admin/block-date').set('Authorization', 'Bearer test-admin-token').send({
        apartmentId, date: testDate, reason: 'Test',
      });
      expect(blockRes.status).toBe(201);
      const res = await request(app).delete(`/api/v1/admin/block-date/${blockRes.body.data.blocked.id}`).set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
    });
  });

  // ─── Security ─────────────────────────────────────────────────

  describe('Security', () => {
    it('returns helmet security headers', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(res.headers).toHaveProperty('x-frame-options');
    });

    it('does not leak secrets in health response', async () => {
      const res = await request(app).get('/api/v1/health');
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('sk_test_');
      expect(body).not.toContain('password');
      expect(body).not.toContain('secret');
    });

    it('returns 404 for unknown API routes', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');
      expect(res.status).toBe(404);
    });
  });
});
