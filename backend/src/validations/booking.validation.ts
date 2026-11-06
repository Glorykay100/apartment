import { z } from 'zod';

export const calculateQuoteSchema = z.object({
  apartmentId: z.string().min(1, 'Apartment ID is required'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD'),
  guestCount: z.coerce.number().min(1, 'At least 1 guest required'),
});

export const createBookingSchema = z.object({
  apartmentId: z.string().min(1, 'Apartment ID is required'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-in must be YYYY-MM-DD'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Check-out must be YYYY-MM-DD'),
  guestCount: z.coerce.number().min(1, 'At least 1 guest required'),
  guestFullName: z.string().min(2, 'Guest full name is required'),
  guestEmail: z.string().email('Valid email is required').toLowerCase(),
  guestPhone: z.string().min(7, 'Valid phone number is required'),
  specialRequests: z.string().optional(),
  addOnsTotal: z.coerce.number().min(0).default(0),
  acceptsNonRefundPolicy: z
    .boolean()
    .optional()
    .refine((value) => value !== false, {
      message: 'You must accept the non-refundable booking policy before booking.',
    }),
});
