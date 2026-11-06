import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { signJwtToken, setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { BUSINESS_CONFIG } from '../config/business';
import { Role } from '@prisma/client';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, phone, marketingConsent, termsAccepted } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const marketingOptIn = Boolean(marketingConsent);
    const acceptsTerms = Boolean(termsAccepted);
    const ipAddress = req.ip || null;
    const userAgent = req.headers['user-agent'] || null;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone: phone || null,
        role: Role.GUEST,
        emailVerified: false,
        termsAcceptedAt: acceptsTerms ? new Date() : null,
        termsVersion: acceptsTerms ? BUSINESS_CONFIG.termsVersion : null,
        emailPreferences: {
          create: {
            marketingOptIn,
            optInAt: marketingOptIn ? new Date() : null,
            source: 'signup',
          },
        },
        consents: acceptsTerms
          ? {
              create: [
                {
                  documentType: 'terms',
                  version: BUSINESS_CONFIG.termsVersion,
                  ipAddress,
                  userAgent,
                },
                {
                  documentType: 'privacy',
                  version: BUSINESS_CONFIG.privacyVersion,
                  ipAddress,
                  userAgent,
                },
              ],
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration. Please try again.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
      return;
    }

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Successfully logged in.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during authentication.',
    });
  }
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Successfully logged out.',
  });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User profile not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent user enumeration
    if (user) {
      // Generate raw token (sent to user via email)
      const rawToken = crypto.randomBytes(32).toString('hex');

      // Hash the token for storage (so a DB leak doesn't expose valid reset tokens)
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Set expiry to 1 hour from now
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expires,
        },
      });

      // Build reset link with the raw (unhashed) token
      const resetLink = `${BUSINESS_CONFIG.websiteUrl}/reset-password?token=${rawToken}`;

      // TODO: Replace with Brevo email service once integrated
      // For now, log the link so it can be retrieved during development/testing
      console.log(`📧 [Password Reset] Reset link for ${email}: ${resetLink}`);
    }

    res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, password reset instructions have been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Password reset request failed.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    // Hash the incoming token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user by hashed token that hasn't expired
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear the reset token + expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been successfully reset. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};
