import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { BUSINESS_CONFIG } from '../config/business';
import {
  sendPaymentReminderEmailOnce,
  sendBookingExpiredEmailOnce,
  processEmailRetries,
} from '../services/email.service';

/**
 * Recurring maintenance jobs. Called by an external scheduler (e.g. cron,
 * GitHub Actions, Render Cron) with the shared secret header.
 */
export const runJobs = async (req: Request, res: Response): Promise<void> => {
  const secret = String(req.headers['x-jobs-secret'] || '');
  const expected = process.env.JOBS_SECRET || 'test-jobs-secret';
  if (secret !== expected) {
    res.status(401).json({ success: false, message: 'Unauthorized jobs call.' });
    return;
  }

  try {
    const now = new Date();
    const holdMs = BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000;
    const reminderCutoffMs = holdMs * (BUSINESS_CONFIG.paymentReminderPercent / 100);

    // 1. Expire unpaid holds past their deadline (never PAID bookings).
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        holdExpiresAt: { lt: now },
      },
      include: { apartment: true },
    });

    const expired: string[] = [];
    for (const booking of expiredBookings) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED },
      });
      await sendBookingExpiredEmailOnce({ ...booking, status: BookingStatus.EXPIRED } as any);
      expired.push(booking.reference);
    }

    // 2. Payment reminders for unexpired pending holds in the reminder window.
    const reminderCandidates = await prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        holdExpiresAt: { gte: now },
      },
      include: { apartment: true },
    });

    const reminded: string[] = [];
    for (const booking of reminderCandidates) {
      if (!booking.holdExpiresAt) continue;
      const remainingMs = new Date(booking.holdExpiresAt).getTime() - now.getTime();
      if (remainingMs > reminderCutoffMs) continue;
      const sent = await sendPaymentReminderEmailOnce(booking);
      if (sent) reminded.push(booking.reference);
    }

    // 3. Retry failed emails whose backoff window has elapsed.
    const retries = await processEmailRetries();

    res.status(200).json({
      success: true,
      message: 'Jobs completed.',
      data: {
        expiredHolds: expired.length,
        expiredReferences: expired,
        paymentReminders: reminded.length,
        remindedReferences: reminded,
        emailRetries: retries,
        ranAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Jobs run error:', error);
    res.status(500).json({ success: false, message: 'Jobs run failed.' });
  }
};
