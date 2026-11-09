import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  logout,
  getMe,
  supabaseLogin,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const authRouter = Router();

// Rate limiting to defend against brute-force attacks on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

const legacyPasswordEndpoint = (_req: import('express').Request, res: import('express').Response) => {
  res.status(410).json({ success: false, message: 'Password authentication is now managed by Supabase Auth.' });
};
authRouter.post('/register', authLimiter, legacyPasswordEndpoint);
authRouter.post('/login', authLimiter, legacyPasswordEndpoint);
authRouter.post('/supabase-login', authLimiter, supabaseLogin);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);
authRouter.post('/forgot-password', authLimiter, legacyPasswordEndpoint);
authRouter.post('/reset-password', authLimiter, legacyPasswordEndpoint);

export default authRouter;
