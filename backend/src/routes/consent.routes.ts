import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { recordConsent, checkTermsStatus } from '../controllers/consent.controller';

const consentRouter = Router();

consentRouter.use(authenticate);

consentRouter.post('/accept', recordConsent);
consentRouter.get('/terms-status', checkTermsStatus);

export default consentRouter;
