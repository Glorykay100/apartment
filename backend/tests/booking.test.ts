import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';

describe('Booking Engine & Collision Prevention API (/api/v1/bookings)', () => {
  let apartmentId: string;

  beforeAll(async () => {
    const apt = await prisma.apartment.findFirst({
      where: { isPublished: true },
    });
    if (!apt) throw new Error('No apartment found in test db');
    apartmentId = apt.id;
  });

  beforeEach(async () => {
    // Clean only this file's test bookings (vitest runs test files in
    // parallel, so a broad deleteMany would race with other test files)
    await prisma.booking.deleteMany({
      where: {
        apartmentId,
        OR: [
          { guestEmail: { startsWith: 'emeka.' } },
          { guestEmail: { startsWith: 'original.' } },
          { guestEmail: { startsWith: 'conflict.' } },
          { guestEmail: { startsWith: 'paystack.' } },
        ],
      },
    });
  });

  it('should calculate server-side quote with accurate fees', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/calculate-quote')
      .send({
        apartmentId,
        checkIn: '2026-12-01',
        checkOut: '2026-12-04', // 3 nights
        guestCount: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const quote = res.body.data.quote;
    expect(quote.nights).toBe(3);
    expect(quote.subtotal).toBe(quote.nightlyRate * 3);
    expect(quote.totalAmount).toBe(
      quote.subtotal + quote.cleaningFee + quote.serviceFee
    );
  });

  it('should reject calculation when checkOut is before checkIn', async () => {
    const res = await request(app)
      .post('/api/v1/bookings/calculate-quote')
      .send({
        apartmentId,
        checkIn: '2026-12-10',
        checkOut: '2026-12-05',
        guestCount: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should create an atomic booking reservation', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        guestCount: 2,
        guestFullName: 'Emeka Anyaoku',
        guestEmail: `emeka.${Date.now()}@example.com`,
        guestPhone: '+2348023456789',
        specialRequests: 'Late arrival around 8pm',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.reference).toMatch(/^YAH-\d{4}-[A-Z0-9]{4}$/);
    expect(res.body.data.booking.status).toBe('PENDING');
  });

  it('CRITICAL: should reject overlapping booking for the same dates (Conflict 409)', async () => {
    // 1. Create original reservation: 2026-12-15 to 2026-12-18
    const firstRes = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        guestCount: 2,
        guestFullName: 'Original Guest',
        guestEmail: `original.${Date.now()}@example.com`,
        guestPhone: '+2348022222222',
      });
    expect(firstRes.status).toBe(201);

    // 2. Attempt overlapping reservation: 2026-12-16 to 2026-12-20
    const res = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn: '2026-12-16',
        checkOut: '2026-12-20',
        guestCount: 1,
        guestFullName: 'Conflicting Guest',
        guestEmail: `conflict.${Date.now()}@example.com`,
        guestPhone: '+2348099999999',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('unavailable');
  });

  it('should initialize and verify Paystack transaction for booking', async () => {
    // 1. Create a fresh booking
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .send({
        apartmentId,
        checkIn: '2026-12-25',
        checkOut: '2026-12-28',
        guestCount: 2,
        guestFullName: 'Paystack Tester',
        guestEmail: `paystack.${Date.now()}@example.com`,
        guestPhone: '+2348011223344',
      });

    expect(bookRes.status).toBe(201);
    const booking = bookRes.body.data.booking;

    // 2. Initialize payment
    const initRes = await request(app)
      .post('/api/v1/payments/initialize')
      .send({ bookingReference: booking.reference });

    expect(initRes.status).toBe(200);
    expect(initRes.body.success).toBe(true);
    expect(initRes.body.data).toHaveProperty('authorization_url');

    // 3. Verify payment
    const verifyRes = await request(app).get(
      `/api/v1/payments/verify/${booking.reference}`
    );

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.booking.status).toBe('CONFIRMED');
    expect(verifyRes.body.data.booking.paymentStatus).toBe('PAID');
  });
});
