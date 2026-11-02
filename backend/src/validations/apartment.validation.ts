import { z } from 'zod';

export const apartmentQuerySchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().min(1).optional(),
  guests: z.coerce.number().min(1).optional(),
  amenities: z.string().optional(), // Comma-separated amenity IDs or names
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'rating']).default('newest'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export const availabilityQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format')
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
