import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';
import { prisma } from '../src/config/db';

describe('Paystack Hardening Tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    const apt = await prisma.apartment.findFirst({
      where: { isPublished: true },
    });
    if (!apt) throw new Error('No apartment found in test db');
    apartmentId = apt.id;
  });

  beforeEach(async () => {
    // Clean up test bookings and webhook events
    await prisma.webhookEvent.deleteMany({
      where: { provider: 'paystack' },
    });
    await prisma.booking.deleteMany({
      where: {
        guestEmail: { contains: 'paystack-test' },
      },
    });
  });

  /**
   * Helper: Create a booking and return it
   */
  const createTestBooking = async (email: string, checkIn: string, checkOut: string) => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn,
        checkOut,
        guestCount: 1,
        guestFullName: 'Paystack Test User',
        guestEmail: email,
        guestPhone: '+2348012345678',
      });
    expect(res.status).toBe(201);
    return res.body.data.booking;
  };

  /**
   * Helper: Build a Paystack charge.success webhook payload
   */
  const buildWebhookEvent = (bookingRef: string, amountInKobo: number, channel = 'card') => {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return {
      id: eventId,
      event: 'charge.success',
      data: {
        reference: `PSTK_${bookingRef}_${Date.now()}`,
        amount: amountInKobo,
        currency: 'NGN',
        channel,
        paid_at: new Date().toISOString(),
        metadata: {
          bookingReference: bookingRef,
        },
      },
    };
  };

  /**
   * Helper: Sign a webhook payload and post it to the webhook endpoint.
   * Sends the raw JSON string (NOT a Buffer — supertest would serialize
   * Buffers as {"type":"Buffer",...}, changing the bytes that get signed).
   */
  const postSignedWebhook = async (payload: object) => {
    const rawStr = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_1234567890')
      .update(rawStr)
      .digest('hex');

    return request(app)
      .post('/api/v1/payments/webhook')
      .set('x-paystack-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawStr);
  };

  // ─── Test 1: Invalid signature ──────────────────────────────────

  it('should reject webhook with invalid signature (401)', async () => {
    const booking = await createTestBooking(
      `paystack-test-sig-${Date.now()}@example.com`,
      '2027-01-10',
      '2027-01-13'
    );

    const payload = buildWebhookEvent(booking.reference, booking.totalAmount * 100);

    const res = await request(app)
      .post('/api/v1/payments/webhook')
      .set('x-paystack-signature', 'invalid_signature_12345')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(payload));

    expect(res.status).toBe(401);
    expect(res.text).toContain('Invalid signature');
  });

  // ─── Test 2: Idempotent webhook ─────────────────────────────────

  it('should be idempotent: processing the same webhook twice does not duplicate confirmations', async () => {
    const booking = await createTestBooking(
      `paystack-test-idempotent-${Date.now()}@example.com`,
      '2027-02-10',
      '2027-02-13'
    );

    const payload = buildWebhookEvent(booking.reference, booking.totalAmount * 100);

    // First delivery
    const res1 = await postSignedWebhook(payload);

    expect(res1.status).toBe(200);
    expect(res1.text).toContain('Webhook processed');

    // Verify booking is confirmed
    const confirmed = await prisma.booking.findUnique({
      where: { reference: booking.reference },
    });
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.paymentStatus).toBe('PAID');

    // Second delivery (duplicate)
    const res2 = await postSignedWebhook(payload);

    expect(res2.status).toBe(200);
    expect(res2.text).toContain('already processed');

    // Verify no duplicate in webhook_events
    const events = await prisma.webhookEvent.findMany({
      where: { provider: 'paystack', reference: { contains: booking.reference } },
    });
    // Should have exactly 1 event stored
    expect(events.length).toBe(1);
  });

  // ─── Test 3: Amount mismatch ─────────────────────────────────────

  it('should NOT confirm booking when webhook amount does not match booking total', async () => {
    const booking = await createTestBooking(
      `paystack-test-amount-${Date.now()}@example.com`,
      '2027-03-10',
      '2027-03-13'
    );

    // Build webhook with WRONG amount (1 naira in kobo — clearly wrong)
    const wrongAmount = 100; // ₦1 in kobo — clearly wrong
    const payload = buildWebhookEvent(booking.reference, wrongAmount);

    const res = await postSignedWebhook(payload);

    expect(res.status).toBe(200);
    expect(res.text).toContain('amount mismatch');

    // Verify booking is NOT confirmed
    const notConfirmed = await prisma.booking.findUnique({
      where: { reference: booking.reference },
    });
    expect(notConfirmed?.status).toBe('PENDING');
    expect(notConfirmed?.paymentStatus).toBe('UNPAID');
  });

  // ─── Test 4: Expired hold releases dates ─────────────────────────

  it('should release expired holds: new booking succeeds after hold expires', async () => {
    // Create a booking with holdExpiresAt in the past
    const email = `paystack-test-expired-${Date.now()}@example.com`;
    const booking = await createTestBooking(email, '2027-04-10', '2027-04-13');

    // Manually expire the hold
    await prisma.booking.update({
      where: { id: booking.id },
      data: { holdExpiresAt: new Date(Date.now() - 1000) }, // 1 second ago
    });

    // Now a new booking for the same dates should succeed
    const newRes = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn: '2027-04-10',
        checkOut: '2027-04-13',
        guestCount: 1,
        guestFullName: 'New Guest After Expiry',
        guestEmail: `paystack-test-newafter-${Date.now()}@example.com`,
        guestPhone: '+2348099887766',
      });

    expect(newRes.status).toBe(201);
    expect(newRes.body.success).toBe(true);
  });

  // ─── Test 5: Valid webhook confirms booking ─────────────────────

  it('should confirm booking when valid webhook with correct amount is received', async () => {
    const booking = await createTestBooking(
      `paystack-test-success-${Date.now()}@example.com`,
      '2027-05-10',
      '2027-05-13'
    );

    const payload = buildWebhookEvent(booking.reference, booking.totalAmount * 100, 'card');

    const res = await postSignedWebhook(payload);

    expect(res.status).toBe(200);
    expect(res.text).toContain('Webhook processed');

    const confirmed = await prisma.booking.findUnique({
      where: { reference: booking.reference },
    });
    expect(confirmed?.status).toBe('CONFIRMED');
    expect(confirmed?.paymentStatus).toBe('PAID');
    expect(confirmed?.paystackChannel).toBe('card');
  });

  // ─── Test 6: Initialize payment uses unique reference ────────────

  it('should generate a unique Paystack reference per initialization attempt', async () => {
    const booking = await createTestBooking(
      `paystack-test-unique-ref-${Date.now()}@example.com`,
      '2027-06-10',
      '2027-06-13'
    );

    const init1 = await request(app)
      .post('/api/v1/payments/initialize')
      .send({ bookingReference: booking.reference });

    expect(init1.status).toBe(200);
    expect(init1.body.success).toBe(true);
    const ref1 = init1.body.data.reference;

    const init2 = await request(app)
      .post('/api/v1/payments/initialize')
      .send({ bookingReference: booking.reference });

    expect(init2.status).toBe(200);
    const ref2 = init2.body.data.reference;

    // Each initialization should have a different reference
    expect(ref1).not.toBe(ref2);
    // Both should start with the booking reference
    expect(ref1).toContain(booking.reference);
    expect(ref2).toContain(booking.reference);
  });
});
