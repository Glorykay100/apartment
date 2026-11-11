import { Router } from 'express';
import {
  subscribeNewsletter,
  confirmNewsletter,
  unsubscribeByToken,
  unsubscribeNewsletter,
  handleBrevoWebhook,
} from '../services/email.service';

const newsletterRouter = Router();

newsletterRouter.post('/subscribe', subscribeNewsletter);
newsletterRouter.get('/confirm', confirmNewsletter);
newsletterRouter.get('/unsubscribe', unsubscribeByToken);
newsletterRouter.post('/unsubscribe', unsubscribeNewsletter);
newsletterRouter.post('/brevo-webhook', handleBrevoWebhook);

export default newsletterRouter;
