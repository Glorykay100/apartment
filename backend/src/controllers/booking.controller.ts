import { Request, Response } from 'express';
import { prisma } from '../config/db';
import {
  calculateQuoteDetails,
  createReservation,
  BookingConflictError,
  ValidationError,
} from '../services/booking.service';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export const calculateQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apartmentId, checkIn, checkOut, guestCount } = req.body;

    const quote = await calculateQuoteDetails(
      apartmentId,
      checkIn,
      checkOut,
      Number(guestCount)
    );

    res.status(200).json({
      success: true,
      data: { quote },
    });
  } catch (error: any) {
    if (error instanceof BookingConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Calculate quote error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate quote' });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.acceptsNonRefundPolicy === false) {
      res.status(400).json({
        success: false,
        message: 'You must accept the non-refundable booking policy before booking.',
      });
      return;
    }

    const booking = await createReservation({
      ...req.body,
      userId: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Reservation initiated successfully.',
      data: { booking },
    });
  } catch (error: any) {
    if (error instanceof BookingConflictError) {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
    if (error instanceof ValidationError) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
};

export const getBookingByReference = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { reference } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { reference },
      include: {
        apartment: {
          include: {
            images: { orderBy: { order: 'asc' } },
            amenities: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking reservation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
  }
};

export const getMyBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        apartment: {
          include: {
            images: { take: 1 },
          },
        },
        review: true,
      },
    });

    res.status(200).json({
      success: true,
      data: { bookings },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user bookings' });
  }
};

export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    // Ensure authorized user (owner or admin)
    if (req.user?.role !== 'ADMIN' && booking.userId !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this booking' });
      return;
    }

    if (booking.status === BookingStatus.CANCELLED) {
      res.status(400).json({ success: false, message: 'Booking is already cancelled' });
      return;
    }

    const now = new Date();
    const checkIn = new Date(booking.checkIn);
    const diffHours = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundStatus =
      'All confirmed bookings are final and non-refundable. Yahsab may offer a written exception at its sole discretion only.';

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    res.status(200).json({
      success: true,
      message: `Reservation cancelled successfully. ${refundStatus}.`,
      data: { booking: updated, refundPolicyNote: refundStatus },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
};
