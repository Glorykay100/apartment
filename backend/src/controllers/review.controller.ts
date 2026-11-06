import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  cleanliness: z.number().int().min(1).max(5),
  accuracy: z.number().int().min(1).max(5),
  location: z.number().int().min(1).max(5),
  value: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review comment must be at least 10 characters').max(2000),
});

/**
 * Submit a review for a completed stay.
 * Only the booking owner can review, and only if the booking is CONFIRMED/COMPLETED
 * and the check-out date has passed.
 */
export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required to submit a review.' });
      return;
    }

    const { bookingId } = req.params;
    const validated = reviewSchema.parse(req.body);

    // Find the booking — must belong to this user and be a completed stay
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { apartment: true, review: true },
    });

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found.' });
      return;
    }

    if (booking.userId !== req.user.id) {
      res.status(403).json({ success: false, message: 'You can only review your own bookings.' });
      return;
    }

    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') {
      res.status(400).json({ success: false, message: 'Only confirmed or completed stays can be reviewed.' });
      return;
    }

    // Check that check-out has passed
    const now = new Date();
    if (new Date(booking.checkOut) > now) {
      res.status(400).json({ success: false, message: 'You can only review after your stay has ended.' });
      return;
    }

    // Check if already reviewed (unique constraint on bookingId)
    if (booking.review) {
      res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        apartmentId: booking.apartmentId,
        bookingId: booking.id,
        userId: req.user.id,
        rating: validated.rating,
        cleanliness: validated.cleanliness,
        accuracy: validated.accuracy,
        location: validated.location,
        value: validated.value,
        comment: validated.comment,
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your review!',
      data: { review },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
      return;
    }
    console.error('Submit review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};
