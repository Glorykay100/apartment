import { Router } from 'express';
import {
  calculateQuote,
  createBooking,
  getBookingByReference,
  getMyBookings,
  cancelBooking,
  completePayment,
} from '../controllers/booking.controller';
import { validate } from '../middleware/validate';
import { authenticate, requireCurrentConsent } from '../middleware/auth';
import {
  calculateQuoteSchema,
  createBookingSchema,
} from '../validations/booking.validation';

const bookingRouter = Router();

bookingRouter.post('/calculate-quote', validate(calculateQuoteSchema), calculateQuote);
bookingRouter.post('/', authenticate, requireCurrentConsent, validate(createBookingSchema), createBooking);
bookingRouter.get('/my-bookings', authenticate, getMyBookings);
bookingRouter.get('/:reference', authenticate, getBookingByReference);
bookingRouter.post('/:id/cancel', authenticate, requireCurrentConsent, cancelBooking);
bookingRouter.post('/:reference/complete-payment', authenticate, requireCurrentConsent, completePayment);

export default bookingRouter;
