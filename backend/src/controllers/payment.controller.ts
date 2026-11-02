import { Request, Response } from 'express';
import { prisma } from '../config/db';
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from '../services/paystack.service';
import { sendBookingConfirmationEmail } from '../services/email.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

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
      amountInKobo: booking.totalAmount * 100, // Paystack operates in kobo
      reference: `PSTK_${booking.reference}_${Date.now()}`,
      callbackUrl,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        apartmentTitle: booking.apartment.title,
        guestFullName: booking.guestFullName,
      },
    });

    // Save paystack reference on booking
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

    // Locate booking by reference or paystackReference
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

    // If already confirmed, return idempotently
    if (booking.status === BookingStatus.CONFIRMED && booking.paymentStatus === PaymentStatus.PAID) {
      res.status(200).json({
        success: true,
        message: 'Booking is already confirmed.',
        data: { booking },
      });
      return;
    }

    // Verify transaction through Paystack API
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

      // Send email confirmation
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
    const signature = req.headers['x-paystack-signature'] as string;

    // Validate signature
    const isValid = verifyPaystackWebhookSignature(
      signature || '',
      JSON.stringify(req.body)
    );

    if (!isValid && process.env.NODE_ENV === 'production') {
      res.status(401).send('Invalid signature');
      return;
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data;
      const bookingRef = metadata?.bookingReference;

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
