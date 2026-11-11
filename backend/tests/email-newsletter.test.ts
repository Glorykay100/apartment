import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { ensureConsent, getGuestId, getApartmentId } from './helpers';

const auth = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: auth.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    return null;
  }),
}));

describe('Email & Newsletter — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    await ensureConsent(auth.guestId);
    apartmentId = await getApartmentId();
  });

  beforeEach(async () => {
    await prisma.receipt.deleteMany({ where: { booking: { guestEmail: { contains: 'qa-email' } } } });
    await prisma.booking.deleteMany({ where: { guestEmail: { contains: 'qa-email' } } });
  });

  describe('Newsletter subscribe/unsubscribe', () => {
    it('subscribes a new email (200) and starts double opt-in', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: 'qa-subscribe@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/confirm/i);
    });

    it('rejects invalid email (400)', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    it('rejects missing email (400)', async () => {
      const res = await request(app).post('/api/v1/newsletter/subscribe').send({});
      expect(res.status).toBe(400);
    });

    it('unsubscribe removes from active list (200)', async () => {
      await request(app).post('/api/v1/newsletter/subscribe').send({ email: 'qa-unsub@test.com' });
      const res = await request(app).post('/api/v1/newsletter/unsubscribe').send({ email: 'qa-unsub@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('rejects unsubscribe with invalid email (400)', async () => {
      const res = await request(app).post('/api/v1/newsletter/unsubscribe').send({ email: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('Email service — mock mode', () => {
    it('sendBookingConfirmationEmail is non-fatal — does not crash on Brevo outage', async () => {
      const booking = await prisma.booking.create({
        data: {
          reference: 'YAH-QA-EMAIL-001', apartmentId, userId: auth.guestId,
          guestFullName: 'Email Tester', guestEmail: 'qa-email@test.com', guestPhone: '+2348012345678',
          checkIn: new Date('2027-06-01'), checkOut: new Date('2027-06-04'),
          nights: 3, guestCount: 2, nightlyRate: 50000, subtotal: 150000,
          cleaningFee: 5000, serviceFee: 7500, totalAmount: 162500,
          status: 'CONFIRMED', paymentStatus: 'PAID', paystackReference: 'PSTK_QA_EMAIL_001',
        },
      });
      const emailService = await import('../src/services/email.service');
      const apartment = await prisma.apartment.findUnique({ where: { id: apartmentId } });
      if (!apartment) throw new Error('Missing apartment');

      // Simulate a full Brevo outage
      emailService._setSendImpl(async () => {
        throw new Error('Brevo SMTP unavailable');
      });
      await expect(
        emailService.sendBookingConfirmationEmail({ ...booking, apartment })
      ).resolves.not.toThrow();

      // The booking is untouched by the email failure
      const after = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
      expect(after.status).toBe('CONFIRMED');
      expect(after.paymentStatus).toBe('PAID');

      // With the transport healthy again, the same email includes the PDF receipt
      const sent: any[] = [];
      emailService._setSendImpl(async (opts) => {
        sent.push(opts);
        return 'simulated';
      });
      await emailService.sendBookingConfirmationEmail({ ...booking, apartment });
      expect(sent).toHaveLength(1);
      expect(sent[0].attachments).toHaveLength(1);
      expect(sent[0].attachments[0].content.subarray(0, 5).toString()).toBe('%PDF-');
      emailService._setSendImpl(null);

      // Cleanup: receipt rows reference the booking, remove them first
      await prisma.receipt.deleteMany({ where: { bookingId: booking.id } });
      await prisma.booking.deleteMany({ where: { id: booking.id } });
    });

    it('welcome email is sent only once (idempotent)', async () => {
      // Create a real user so the FK constraint is satisfied
      const welcomeUser = await prisma.user.create({
        data: { email: 'qa-welcome@test.com', passwordHash: 'test', fullName: 'Welcome Tester', role: 'GUEST' },
      });
      const { sendWelcomeEmailOnce } = await import('../src/services/email.service');
      const user = { id: welcomeUser.id, email: welcomeUser.email, fullName: welcomeUser.fullName };
      await prisma.emailLog.deleteMany({ where: { userId: user.id } });
      await sendWelcomeEmailOnce(user);
      const logs1 = await prisma.emailLog.findMany({ where: { userId: user.id, type: 'welcome' } });
      expect(logs1.length).toBe(1);
      expect(logs1[0].status).toBe('SENT');
      await sendWelcomeEmailOnce(user);
      const logs2 = await prisma.emailLog.findMany({ where: { userId: user.id, type: 'welcome' } });
      expect(logs2.length).toBe(1);
      await prisma.emailLog.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: welcomeUser.id } });
    });
  });
});
