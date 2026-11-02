import { Router } from 'express';
import {
  calculateQuote,
  createBooking,
  getBookingByReference,
  getMyBookings,
  cancelBooking,
} from '../controllers/booking.controller';
import { validate } from '../middleware/validate';
import { optionalAuth, authenticate } from '../middleware/auth';
import {
  calculateQuoteSchema,
  createBookingSchema,
} from '../validations/booking.validation';

const bookingRouter = Router();

bookingRouter.post('/calculate-quote', validate(calculateQuoteSchema), calculateQuote);
bookingRouter.post('/', optionalAuth, validate(createBookingSchema), createBooking);
bookingRouter.get('/my-bookings', authenticate, getMyBookings);
bookingRouter.get('/:reference', getBookingByReference);
bookingRouter.post('/:id/cancel', authenticate, cancelBooking);

export default bookingRouter;
