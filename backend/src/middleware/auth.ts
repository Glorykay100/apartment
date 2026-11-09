import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { UserTokenPayload } from '../utils/jwt';
import { verifySupabaseToken } from '../config/supabaseAuth';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

/**
 * Extracts a bearer token from the request.
 *
 * Only a Supabase access token is accepted on protected routes.
 */
function extractToken(req: Request): string | undefined {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return undefined;
}

/**
 * Primary authentication middleware.
 *
 * Supabase verifies the token signature, expiry and audience. Application
 * identity and role are then loaded from the existing PostgreSQL User row.
 *
 * Never trusts a user ID from the client — the Supabase token is verified
 * server-side, and the role always comes from our own User table.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
      return;
    }

    const userPayload = await verifySupabaseToken(token);
    if (!userPayload) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.',
      });
      return;
    }
    req.user = userPayload;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.',
    });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Administrative privileges are required.',
    });
    return;
  }
  next();
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const userPayload = await verifySupabaseToken(token);
    if (userPayload) req.user = userPayload;
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

/** Blocks booking/payment actions until all current legal documents are accepted. */
export const requireCurrentConsent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }
  try {
    const { prisma } = await import('../config/db');
    const { BUSINESS_CONFIG } = await import('../config/business');
    const accepted = await prisma.consentRecord.findMany({
      where: { userId: req.user.id, documentType: { in: ['terms', 'privacy', 'refund'] } },
      select: { documentType: true, version: true },
      orderBy: { acceptedAt: 'desc' },
    });
    const latest = new Map<string, string>();
    for (const record of accepted) if (!latest.has(record.documentType)) latest.set(record.documentType, record.version);
    const current: Record<string, string> = {
      terms: BUSINESS_CONFIG.termsVersion,
      privacy: BUSINESS_CONFIG.privacyVersion,
      refund: BUSINESS_CONFIG.refundVersion,
    };
    const missing = Object.entries(current).some(([document, version]) => latest.get(document) !== version);
    if (missing) {
      res.status(428).json({ success: false, code: 'CONSENT_REQUIRED', message: 'Please accept the current Terms, Privacy Policy and Refund Policy before continuing.' });
      return;
    }
    next();
  } catch {
    res.status(500).json({ success: false, message: 'Unable to verify legal consent.' });
  }
};
