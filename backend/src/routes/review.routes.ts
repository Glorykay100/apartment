import { Router } from 'express';
import { submitReview } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { reviewSchema } from '../controllers/review.controller';

const reviewRouter = Router();

// Submit a review for a booking (authenticated users only)
reviewRouter.post('/:bookingId', authenticate, validate(reviewSchema), submitReview);

export default reviewRouter;
