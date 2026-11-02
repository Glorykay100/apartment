import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller';

const contactRouter = Router();

contactRouter.post('/', submitContact);

export default contactRouter;
