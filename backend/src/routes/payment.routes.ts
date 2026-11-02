import { Router } from 'express';
import {
  initializePayment,
  verifyPayment,
  handlePaystackWebhook,
} from '../controllers/payment.controller';

const paymentRouter = Router();

paymentRouter.post('/initialize', initializePayment);
paymentRouter.get('/verify/:reference', verifyPayment);
paymentRouter.post('/webhook', handlePaystackWebhook);

export default paymentRouter;
