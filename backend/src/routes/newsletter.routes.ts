import { Router } from 'express';
import { subscribeNewsletter, unsubscribeNewsletter } from '../services/email.service';

const newsletterRouter = Router();

newsletterRouter.post('/subscribe', subscribeNewsletter);
newsletterRouter.post('/unsubscribe', unsubscribeNewsletter);

export default newsletterRouter;
