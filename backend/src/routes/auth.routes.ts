import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
} from '../validations/auth.validation';

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

authRouter.post('/register', authLimiter, validate(registerSchema), register);
authRouter.post('/login', authLimiter, validate(loginSchema), login);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, getMe);
authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

export default authRouter;
