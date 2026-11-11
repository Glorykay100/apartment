import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  handlePaystackWebhook,
  downloadReceipt,
} from '../controllers/payment.controller';
import { authenticate, requireCurrentConsent } from '../middleware/auth';

const paymentRouter = Router();

paymentRouter.post('/initialize', authenticate, requireCurrentConsent, initializePayment);
paymentRouter.get('/verify/:reference', authenticate, requireCurrentConsent, verifyPayment);
paymentRouter.get('/receipt/:reference', authenticate, downloadReceipt);
paymentRouter.post('/webhook', handlePaystackWebhook);

export default paymentRouter;
