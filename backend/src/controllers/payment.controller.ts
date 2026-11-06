import { Request, Response } from 'express';
import { prisma } from '../config/db';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from '../services/paystack.service';
import { sendBookingConfirmationEmail } from '../services/email.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

const ensureWebhookEventTable = async () => {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      reference TEXT,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
};

const isDuplicateWebhook = async (eventId: string, reference?: string | null) => {
  await ensureWebhookEventTable();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM webhook_events
    WHERE id = ${eventId}
       OR (reference = ${reference} AND event_type = 'charge.success')
    LIMIT 1
  `;

  return rows.length > 0;
};

const recordWebhookEvent = async (event: any) => {
  await ensureWebhookEventTable();
  const eventId = String(
    event?.id ||
      `${event?.event || 'paystack'}:${event?.data?.reference || event?.data?.metadata?.bookingReference || Date.now()}`
  );
  const reference = event?.data?.reference || event?.data?.metadata?.bookingReference || null;

  await prisma.$executeRaw`
    INSERT INTO webhook_events (id, event_type, reference, payload, created_at)
    VALUES (${eventId}, ${event?.event || 'unknown'}, ${reference}, ${JSON.stringify(event)}::jsonb, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
};

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

    if (booking.status === BookingStatus.CONFIRMED) {
      res.status(400).json({
        success: false,
        message: 'This booking has already been paid and confirmed.',
      });
      return;
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const callbackUrl = `${clientUrl}/booking/confirmation/${booking.reference}`;

    const paystackData = await initializePaystackTransaction({
      email: booking.guestEmail,
      amountInKobo: booking.totalAmount * 100,
      reference: `PSTK_${booking.reference}_${Date.now()}`,
      callbackUrl,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        apartmentTitle: booking.apartment.title,
        guestFullName: booking.guestFullName,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paystackReference: paystackData.reference,
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
      const updated = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paystackPaidAt: new Date(verification.paid_at || Date.now()),
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
      event.id || `${event.event}:${event.data?.reference || event.data?.metadata?.bookingReference || Date.now()}`
    );
    const bookingReference = event.data?.metadata?.bookingReference || event.data?.reference || null;

    if (await isDuplicateWebhook(eventId, bookingReference)) {
      res.status(200).send('Webhook already processed');
      return;
    }

    await recordWebhookEvent(event);

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const bookingRef = metadata?.bookingReference || bookingReference;

      if (bookingRef) {
        const booking = await prisma.booking.findUnique({
          where: { reference: bookingRef },
          include: { apartment: true },
        });

        if (booking && booking.status !== BookingStatus.CONFIRMED) {
          const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: BookingStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
              paystackReference: reference,
              paystackPaidAt: new Date(),
            },
            include: { apartment: true },
          });

          await sendBookingConfirmationEmail(updated);
        }
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing error');
  }
};
