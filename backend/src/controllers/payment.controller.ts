import { Request, Response } from 'express';
import { prisma } from '../config/db';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
  generateUniqueReference,
} from '../services/paystack.service';
import { sendBookingConfirmationEmail } from '../services/email.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BUSINESS_CONFIG } from '../config/business';

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Check for duplicate webhook using the Prisma WebhookEvent model.
 */
const isDuplicateWebhook = async (eventId: string): Promise<boolean> => {
  const existing = await prisma.webhookEvent.findUnique({
    where: {
      provider_eventId: { provider: 'paystack', eventId },
    },
  });
  return !!existing;
};

/**
 * Store a processed webhook event for idempotency.
 */
const recordWebhookEvent = async (event: any): Promise<void> => {
  const eventId = String(
    event.id ||
      `${event.event}:${event.data?.reference || event.data?.metadata?.bookingReference || Date.now()}`
  );
  const reference = event.data?.reference || event.data?.metadata?.bookingReference || null;

  await prisma.webhookEvent.create({
    data: {
      provider: 'paystack',
      eventId,
      eventType: event.event || 'unknown',
      reference,
      payload: event,
    },
  }).catch(() => {
    // Unique constraint violation = duplicate, safe to ignore
  });
};

// ─── Initialize Payment ───────────────────────────────────────────

export const initializePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { bookingReference } = req.body;

    if (!bookingReference) {
      res.status(400).json({ success: false, message: 'Booking reference is required' });
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { reference: bookingReference },
      include: { apartment: true },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You are not allowed to pay for this booking.' });
      return;
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      res.status(400).json({
        success: false,
        message: 'This booking has already been paid and confirmed.',
      });
      return;
    }

    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        message: 'This booking has been cancelled.',
      });
      return;
    }

    // Check if hold has expired
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < new Date()) {
      res.status(400).json({
        success: false,
        message: 'Your payment hold has expired. Please create a new booking.',
      });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || BUSINESS_CONFIG.websiteUrl;
    const callbackUrl = `${clientUrl}/booking/confirmation/${booking.reference}`;

    // Generate a unique reference per attempt
    const paystackRef = generateUniqueReference(booking.reference);

    const paystackData = await initializePaystackTransaction({
      email: booking.guestEmail,
      amountInKobo: booking.totalAmount * 100,
      reference: paystackRef,
      callbackUrl,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        apartmentTitle: booking.apartment.title,
        guestFullName: booking.guestFullName,
      },
    });

    // Update booking with the new Paystack reference and extend hold
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paystackReference: paystackData.reference,
        holdExpiresAt: new Date(Date.now() + BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Paystack payment authorization initialized.',
      data: paystackData,
    });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize payment' });
  }
};

// ─── Verify Payment (callback page) ───────────────────────────────

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reference } = req.params;

    if (!reference) {
      res.status(400).json({ success: false, message: 'Reference is required' });
      return;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ reference }, { paystackReference: reference }],
      },
      include: { apartment: true },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Associated booking not found' });
      return;
    }

    if (booking.userId !== req.user?.id && req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'You are not allowed to view this payment.' });
      return;
    }

    if (booking.status === BookingStatus.CONFIRMED && booking.paymentStatus === PaymentStatus.PAID) {
      res.status(200).json({
        success: true,
        message: 'Booking is already confirmed.',
        data: { booking },
      });
      return;
    }

    const verification = await verifyPaystackTransaction(reference);

    if (verification.status === 'success') {
      // CRITICAL: Verify amount matches booking total (in kobo)
      const expectedAmountKobo = booking.totalAmount * 100;
      if (verification.amount !== expectedAmountKobo) {
        console.error(`[Paystack] Amount mismatch: expected ${expectedAmountKobo}, got ${verification.amount}`);
        res.status(400).json({
          success: false,
          message: 'Payment amount verification failed. The amount paid does not match the booking total.',
        });
        return;
      }

      // CRITICAL: Verify currency is NGN
      if (verification.currency && verification.currency !== 'NGN') {
        console.error(`[Paystack] Currency mismatch: expected NGN, got ${verification.currency}`);
        res.status(400).json({
          success: false,
          message: 'Currency verification failed. Only NGN payments are accepted.',
        });
        return;
      }

      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paystackReference: verification.reference || reference,
          paystackPaidAt: new Date(verification.paid_at || Date.now()),
          paystackChannel: verification.channel || null,
        },
        include: { apartment: true },
      });

      await sendBookingConfirmationEmail(updated);

      res.status(200).json({
        success: true,
        message: 'Payment verified and reservation confirmed!',
        data: { booking: updated },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed or was incomplete.',
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

// ─── Paystack Webhook ─────────────────────────────────────────────

export const handlePaystackWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const signature = String(req.headers['x-paystack-signature'] || '');
    const rawBody = req.body;

    if (!rawBody || !signature) {
      res.status(401).send('Missing Paystack signature or payload');
      return;
    }

    const rawPayload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody));
    if (!verifyPaystackWebhookSignature(signature, rawPayload)) {
      res.status(401).send('Invalid signature');
      return;
    }

    const event = Buffer.isBuffer(rawBody) ? JSON.parse(rawBody.toString('utf8')) : rawBody;
    if (!event || !event.event) {
      res.status(400).send('Invalid Paystack payload');
      return;
    }

    const eventId = String(
      event.id ||
        `${event.event}:${event.data?.reference || event.data?.metadata?.bookingReference || Date.now()}`
    );

    // Idempotency check: has this event been processed before?
    if (await isDuplicateWebhook(eventId)) {
      res.status(200).send('Webhook already processed');
      return;
    }

    // Store the event for idempotency
    await recordWebhookEvent(event);

    // Process charge.success
    if (event.event === 'charge.success') {
      const { reference, metadata, amount, currency, channel, paid_at } = event.data;
      const bookingRef = metadata?.bookingReference;

      if (!bookingRef) {
        console.warn('[Paystack Webhook] No booking reference in metadata');
        res.status(200).send('Webhook processed (no booking reference)');
        return;
      }

      const booking = await prisma.booking.findUnique({
        where: { reference: bookingRef },
        include: { apartment: true },
      });

      if (!booking) {
        console.warn(`[Paystack Webhook] Booking not found: ${bookingRef}`);
        res.status(200).send('Webhook processed (booking not found)');
        return;
      }

      // Already confirmed — don't duplicate
      if (booking.status === BookingStatus.CONFIRMED) {
        res.status(200).send('Webhook processed (already confirmed)');
        return;
      }

      // CRITICAL: Verify amount matches booking total (in kobo)
      const expectedAmountKobo = booking.totalAmount * 100;
      if (amount !== expectedAmountKobo) {
        console.error(
          `[Paystack Webhook] Amount mismatch for ${bookingRef}: expected ${expectedAmountKobo}, got ${amount}`
        );
        // Record the mismatch but don't confirm the booking
        res.status(200).send('Webhook processed (amount mismatch — booking NOT confirmed)');
        return;
      }

      // CRITICAL: Verify currency is NGN
      if (currency && currency !== 'NGN') {
        console.error(
          `[Paystack Webhook] Currency mismatch for ${bookingRef}: expected NGN, got ${currency}`
        );
        res.status(200).send('Webhook processed (currency mismatch — booking NOT confirmed)');
        return;
      }

      // All checks passed — confirm the booking
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paystackReference: reference,
          paystackPaidAt: new Date(paid_at || Date.now()),
          paystackChannel: channel || null,
        },
        include: { apartment: true },
      });

      // Send confirmation email (non-fatal)
      await sendBookingConfirmationEmail(updated).catch((err) =>
        console.error('[Paystack Webhook] Confirmation email failed:', err)
      );
    }

    // Handle failed and abandoned payments (non-fatal logging only)
    if (event.event === 'charge.failed') {
      console.warn(`[Paystack Webhook] Payment failed: ${event.data?.reference || 'unknown'}`);
    }

    if (event.event === 'payment.authorization.abandoned' || event.event === 'transfer.abandoned') {
      console.warn(`[Paystack Webhook] Payment abandoned: ${event.data?.reference || 'unknown'}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing error');
  }
};
