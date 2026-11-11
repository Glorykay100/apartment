import { Apartment, Booking, Receipt } from '@prisma/client';
import { prisma } from '../config/db';

/**
 * Create the durable payment receipt for a confirmed booking (idempotent).
 * Returns the existing receipt if one is already present.
 */
export const ensureReceipt = async (
  booking: Booking & { apartment: Apartment }
): Promise<Receipt> => {
  const existing = await prisma.receipt.findUnique({ where: { bookingId: booking.id } });
  if (existing) return existing;

  // Advisory lock keyed on the booking to avoid duplicate receipt numbers
  // under concurrent webhook + verify calls.
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${booking.id}))`;
    const again = await tx.receipt.findUnique({ where: { bookingId: booking.id } });
    if (again) return again;

    const year = new Date().getFullYear();
    const count = await tx.receipt.count();
    const receiptNumber = `RCT-${year}-${String(count + 1).padStart(6, '0')}`;

    return tx.receipt.create({
      data: {
        receiptNumber,
        bookingId: booking.id,
        userId: booking.userId!,
        amountPaid: booking.totalAmount,
        paystackReference: booking.paystackReference || '',
        channel: booking.paystackChannel,
        guestName: booking.guestFullName,
        guestEmail: booking.guestEmail,
        apartmentTitle: booking.apartment.title,
        apartmentAddress: `${booking.apartment.address}, ${booking.apartment.city}, ${booking.apartment.state}`,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        guestCount: booking.guestCount,
        nightlyRate: booking.nightlyRate,
        subtotal: booking.subtotal,
        cleaningFee: booking.cleaningFee,
        serviceFee: booking.serviceFee,
        totalAmount: booking.totalAmount,
      },
    });
  });
};
