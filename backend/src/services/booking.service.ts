import { prisma } from '../config/db';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { BUSINESS_CONFIG } from '../config/business';

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const generateBookingReference = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `YAH-${new Date().getFullYear()}-${random}`;
};

export const calculateQuoteDetails = async (
  apartmentId: string,
  checkInStr: string,
  checkOutStr: string,
  guestCount: number
) => {
  const apartment = await prisma.apartment.findFirst({
    where: { OR: [{ id: apartmentId }, { slug: apartmentId }], isPublished: true },
  });

  if (!apartment) {
    throw new ValidationError('Apartment not found or unavailable');
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);

  if (checkOut <= checkIn) {
    throw new ValidationError('Check-out date must be after check-in date');
  }

  if (guestCount > apartment.maxGuests) {
    throw new ValidationError(
      `Guest count exceeds maximum allowed for this unit (max ${apartment.maxGuests})`
    );
  }

  // Calculate nights
  const diffTime = checkOut.getTime() - checkIn.getTime();
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (nights < 1) {
    throw new ValidationError('Minimum stay is 1 night');
  }

  // Check for collision with CONFIRMED bookings or active PENDING bookings (not expired)
  const holdExpiry = new Date(Date.now() - BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000);
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      apartmentId: apartment.id,
      OR: [
        { status: BookingStatus.CONFIRMED },
        {
          status: BookingStatus.PENDING,
          // Active pending = either created recently OR has a holdExpiresAt in the future
          OR: [
            { createdAt: { gte: holdExpiry } },
            { holdExpiresAt: { gte: new Date() } },
          ],
        },
      ],
      AND: [{ checkIn: { lt: checkOut } }, { checkOut: { gt: checkIn } }],
    },
  });

  if (overlappingBooking) {
    throw new BookingConflictError(
      'Selected dates are unavailable. Another guest has confirmed or currently reserved these dates.'
    );
  }

  // Check BlockedDate
  const blocked = await prisma.blockedDate.findFirst({
    where: {
      apartmentId: apartment.id,
      date: { gte: checkIn, lt: checkOut },
    },
  });

  if (blocked) {
    throw new BookingConflictError(
      'Selected dates are blocked for maintenance or private reservations.'
    );
  }

  // Extended stay discounts (10% off for 7+ nights, 20% off for 30+ nights)
  let discountRate = 0;
  if (nights >= 30) {
    discountRate = 0.2;
  } else if (nights >= 7) {
    discountRate = 0.1;
  }

  const nightlyRate = apartment.basePricePerNight;
  const rawSubtotal = nights * nightlyRate;
  const discountAmount = Math.round(rawSubtotal * discountRate);
  const subtotal = rawSubtotal - discountAmount;
  const cleaningFee = apartment.cleaningFee;
  const serviceFee = Math.round(subtotal * apartment.serviceFeeRate);
  const totalAmount = subtotal + cleaningFee + serviceFee;

  return {
    apartment,
    checkIn,
    checkOut,
    nights,
    guestCount,
    nightlyRate,
    rawSubtotal,
    discountAmount,
    discountPercent: discountRate * 100,
    subtotal,
    cleaningFee,
    serviceFee,
    totalAmount,
  };
};

export const createReservation = async (params: {
  apartmentId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  userId?: string;
  addOnsTotal?: number;
}) => {
  const quote = await calculateQuoteDetails(
    params.apartmentId,
    params.checkIn,
    params.checkOut,
    params.guestCount
  );

  // If no user is logged in, find or create guest user account
  let userId = params.userId;
  if (!userId) {
    let existingUser = await prisma.user.findUnique({
      where: { email: params.guestEmail },
    });
    if (!existingUser) {
      existingUser = await prisma.user.create({
        data: {
          email: params.guestEmail,
          passwordHash: 'GUEST_UNSET_PASSWORD',
          fullName: params.guestFullName,
          phone: params.guestPhone,
        },
      });
    }
    userId = existingUser.id;
  }

  const addOns = params.addOnsTotal || 0;
  const finalTotal = quote.totalAmount + addOns;

  // Execute atomic transaction with double-booking lock check
  const booking = await prisma.$transaction(async (tx) => {
    // Re-verify collision within transaction to handle race conditions
    const holdExpiry = new Date(Date.now() - BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000);
    const collision = await tx.booking.findFirst({
      where: {
        apartmentId: quote.apartment.id,
        OR: [
          { status: BookingStatus.CONFIRMED },
          {
            status: BookingStatus.PENDING,
            OR: [
              { createdAt: { gte: holdExpiry } },
              { holdExpiresAt: { gte: new Date() } },
            ],
          },
        ],
        AND: [{ checkIn: { lt: quote.checkOut } }, { checkOut: { gt: quote.checkIn } }],
      },
    });

    if (collision) {
      throw new BookingConflictError(
        'Race condition conflict: These dates were just taken by another guest.'
      );
    }

    const reference = generateBookingReference();

    return tx.booking.create({
      data: {
        reference,
        apartmentId: quote.apartment.id,
        userId,
        guestFullName: params.guestFullName,
        guestEmail: params.guestEmail,
        guestPhone: params.guestPhone,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        nights: quote.nights,
        guestCount: quote.guestCount,
        nightlyRate: quote.nightlyRate,
        subtotal: quote.subtotal,
        cleaningFee: quote.cleaningFee,
        serviceFee: quote.serviceFee,
        totalAmount: finalTotal,
        specialRequests: params.specialRequests || null,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        holdExpiresAt: new Date(Date.now() + BUSINESS_CONFIG.bookingHoldMinutes * 60 * 1000),
      },
      include: {
        apartment: {
          include: {
            images: { take: 1 },
          },
        },
      },
    });
  });

  return booking;
};
