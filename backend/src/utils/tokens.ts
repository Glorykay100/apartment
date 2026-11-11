import crypto from 'crypto';

/**
 * Signed, purpose-scoped action tokens for anonymous links
 * (newsletter double opt-in, one-click unsubscribe).
 *
 * Format: base64url(payload).base64url(hmac)
 * payload: JSON { email, purpose, iat, exp }
 */

const ACTION_TOKEN_SECRET =
  process.env.ACTION_TOKEN_SECRET ||
  process.env.JWT_SECRET ||
  'yahsab-action-token-secret-change-me-in-production';

const b64url = (buf: Buffer | string) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromB64url = (str: string) =>
  Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

const sign = (data: string) =>
  b64url(crypto.createHmac('sha256', ACTION_TOKEN_SECRET).update(data).digest());

export const ACTION_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type ActionPurpose = 'newsletter_confirm' | 'newsletter_unsubscribe';

export interface ActionTokenPayload {
  email: string;
  purpose: ActionPurpose;
  iat: number;
  exp: number;
}

export const signActionToken = (
  email: string,
  purpose: ActionPurpose,
  ttlSeconds: number = ACTION_TOKEN_TTL_SECONDS
): string => {
  const payload: ActionTokenPayload = {
    email: email.toLowerCase(),
    purpose,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
};

export interface VerifyResult {
  valid: boolean;
  reason?: 'malformed' | 'bad_signature' | 'expired' | 'wrong_purpose';
  payload?: ActionTokenPayload;
}

export const verifyActionToken = (
  token: string,
  purpose: ActionPurpose
): VerifyResult => {
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: 'malformed' };
  }
  const [body, signature] = parts;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: 'bad_signature' };
  }
  let payload: ActionTokenPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'));
  } catch {
    return { valid: false, reason: 'malformed' };
  }
  if (payload.purpose !== purpose) {
    return { valid: false, reason: 'wrong_purpose' };
  }
  if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true, payload };
};
