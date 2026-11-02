import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { Role } from '@prisma/client';

export interface UserTokenPayload {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'yahsab-super-secret-jwt-key-minimum-32-chars-long';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signJwtToken = (payload: UserTokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any,
  });
};

export const verifyJwtToken = (token: string): UserTokenPayload => {
  return jwt.verify(token, JWT_SECRET) as UserTokenPayload;
};

export const setAuthCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};
