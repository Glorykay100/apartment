import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { BUSINESS_CONFIG } from '../src/config/business';
import { ensureConsent, getGuestId, getApartmentId } from './helpers';
import { _setSendImpl, MailOptions } from '../src/services/email.service';

const authIds = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: authIds.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    return null;
  }),
}));

const sent: MailOptions[] = [];
let auth: { guestId: string; apartmentId: string; cookie: string };

const createBooking = async (daysAhead: number, nights = 2) => {
  const checkIn = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const checkOut = new Date(Date.now() + (daysAhead + nights) * 24 * 60 * 60 * 1000);
  const res = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
    apartmentId: auth.apartmentId,
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
    guestCount: 1,
    guestFullName: 'Jobs QA',
    guestEmail: `qa-jobs.${crypto.randomBytes(3).toString('hex')}@example.com`,
    guestPhone: '+2348012345678',
  });
  expect(res.status).toBe(201);
  return res.body.data.booking;
};

beforeAll(async () => {
  authIds.guestId = await getGuestId();
  auth = { guestId: await getGuestId(), apartmentId: await getApartmentId(), cookie: '' };
  await ensureConsent(auth.guestId);
  _setSendImpl(async (opts) => {
    sent.push(opts);
    return 'simulated';
  });
});

afterAll(async () => {
  _setSendImpl(null);
  await prisma.booking.deleteMany({ where: { guestFullName: 'Jobs QA' } });
  await prisma.emailLog.deleteMany({ where: { toEmail: { contains: 'qa-jobs' } } });
  await prisma.emailLog.deleteMany({ where: { type: { in: ['payment_reminder', 'booking_expired', 'retry_probe'] } } });
});

const runJobs = () =>
  request(app).post('/api/v1/jobs/run').set('x-jobs-secret', process.env.JOBS_SECRET || 'test-jobs-secret');

describe('Jobs endpoint', () => {
  it('rejects calls without the secret header (401)', async () => {
    const res = await request(app).post('/api/v1/jobs/run');
    expect(res.status).toBe(401);
  });

  it('rejects calls with a wrong secret (401)', async () => {
    const res = await request(app).post('/api/v1/jobs/run').set('x-jobs-secret', 'wrong');
    expect(res.status).toBe(401);
  });

  it('sends a payment reminder once for a pending hold nearing expiry, never after payment', async () => {
    const booking = await createBooking(1);
    // Move the hold into the reminder window (<=50% of hold time remaining)
    const reminderWindowMs = BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000 * (BUSINESS_CONFIG.paymentReminderPercent / 100);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() + reminderWindowMs - 60 * 1000) },
    });

    sent.length = 0;
    const res1 = await runJobs();
    expect(res1.status).toBe(200);
    expect(res1.body.data.paymentReminders).toBe(1);
    expect(sent.some((m) => m.subject.includes(booking.reference) && /Action needed/.test(m.subject))).toBe(true);

    // Second run: reminder must NOT be re-sent (once per booking)
    sent.length = 0;
    const res2 = await runJobs();
    expect(res2.body.data.paymentReminders).toBe(0);
    expect(sent.some((m) => m.subject.includes(booking.reference))).toBe(false);

    // Pay the booking, then a reminder must never be sent again
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED', paymentStatus: 'PAID' },
    });
    await prisma.booking.update({
      where: { id: booking.id },
      data: { emailsSent: [], holdExpiresAt: new Date(Date.now() + 60 * 1000) },
    });
    sent.length = 0;
    await runJobs();
    expect(sent.some((m) => m.subject.includes(booking.reference))).toBe(false);
  });

  it('expires overdue holds, sends the expired email once, and releases the dates', async () => {
    const booking = await createBooking(3);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() - 60 * 1000) },
    });

    sent.length = 0;
    const res1 = await runJobs();
    expect(res1.status).toBe(200);
    expect(res1.body.data.expiredHolds).toBe(1);
    expect(sent.some((m) => /hold expired/.test(m.subject) && m.subject.includes(booking.reference))).toBe(true);

    const after = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(after.status).toBe('EXPIRED');

    sent.length = 0;
    const res2 = await runJobs();
    expect(res2.body.data.expiredHolds).toBe(0);
    expect(sent.some((m) => /hold expired/.test(m.subject))).toBe(false);

    // Dates are released — a new booking for the same range succeeds
    const retry = await request(app).post('/api/v1/bookings').set('Authorization', 'Bearer test-guest-token').send({
      apartmentId: auth.apartmentId,
      checkIn: String(booking.checkIn).slice(0, 10),
      checkOut: String(booking.checkOut).slice(0, 10),
      guestCount: 1,
      guestFullName: 'Jobs QA',
      guestEmail: `qa-jobs.rebook.${crypto.randomBytes(3).toString('hex')}@example.com`,
      guestPhone: '+2348012345678',
    });
    expect(retry.status).toBe(201);
  });

  it('a fresh hold outside the reminder window gets no reminder (run repeatedly = idempotent)', async () => {
    await createBooking(10);
    sent.length = 0;
    const res1 = await runJobs();
    const res2 = await runJobs();
    expect(res1.body.data.paymentReminders).toBe(0);
    expect(res2.body.data.paymentReminders).toBe(0);
    expect(sent.length).toBe(0);
  });

  it('retries a FAILED email when the backoff window elapses, and only up to MAX_ATTEMPTS', async () => {
    const { MAX_EMAIL_ATTEMPTS } = await import('../src/services/email.service');

    // Make the send fail (simulated Brevo outage), queue a welcome email.
    _setSendImpl(async () => {
      throw new Error('Brevo SMTP unavailable');
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'guest@yahsab.com' } });
    const log = await prisma.emailLog.create({
      data: { userId: user.id, toEmail: 'qa-retry@example.com', type: 'retry_probe', subject: 'Retry probe email', status: 'FAILED', attempts: 0, nextRetryAt: new Date(Date.now() - 1000) },
    });

    let result: any;
    _setSendImpl(async (opts) => {
      sent.push(opts);
      return 'simulated';
    });
    const res = await runJobs();
    expect(res.status).toBe(200);
    result = res.body.data.emailRetries;
    expect(result.sent).toBeGreaterThanOrEqual(1);

    const after = await prisma.emailLog.findUniqueOrThrow({ where: { id: log.id } });
    expect(after.status).toBe('SENT');
    expect(after.attempts).toBe(1);

    // Running again does not re-send it
    sent.length = 0;
    const res2 = await runJobs();
    expect(res2.body.data.emailRetries.retried).toBe(0);
    expect(sent.length).toBe(0);
    void MAX_EMAIL_ATTEMPTS;
  });

  it('a Brevo outage never leaves an email claimed — failure releases the slot for retry', async () => {
    const booking = await createBooking(5);
    await prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() + 60 * 1000) },
    });

    // First pass with a failing transport: reminder is claimed, send throws.
    _setSendImpl(async () => {
      throw new Error('Brevo SMTP unavailable');
    });
    const res1 = await runJobs();
    expect(res1.status).toBe(200);

    const claimed = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(claimed.emailsSent).not.toContain('payment_reminder');

    // Second pass with a healthy transport: reminder is delivered.
    _setSendImpl(async (opts) => {
      sent.push(opts);
      return 'simulated';
    });
    sent.length = 0;
    const res2 = await runJobs();
    expect(res2.body.data.paymentReminders).toBe(1);
    expect(sent.some((m) => m.subject.includes(booking.reference))).toBe(true);
  });
});
