import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyJwtToken, UserTokenPayload } from '../utils/jwt';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    // Check authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to proceed.',
      });
      return;
    }

    const decoded = verifyJwtToken(token);
    req.user = decoded;
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

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      req.user = verifyJwtToken(token);
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};
