import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  handlePaystackWebhook,
} from '../controllers/payment.controller';
import { authenticate, requireCurrentConsent } from '../middleware/auth';

const paymentRouter = Router();

paymentRouter.post('/initialize', authenticate, requireCurrentConsent, initializePayment);
paymentRouter.get('/verify/:reference', authenticate, requireCurrentConsent, verifyPayment);
paymentRouter.post('/webhook', handlePaystackWebhook);

export default paymentRouter;
