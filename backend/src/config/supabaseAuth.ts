import { createClient } from '@supabase/supabase-js';
import jwt, { Algorithm } from 'jsonwebtoken';
import { createPublicKey } from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { UserTokenPayload } from '../utils/jwt';
import { BUSINESS_CONFIG } from '../config/business';
import { sendWelcomeEmailOnce } from '../services/email.service';

/**
 * Creates a Supabase client for verifying access tokens on the backend.
 *
 * This client uses the anon (public) key, not the service role key.
 * We call supabase.auth.getUser(token) which verifies the JWT signature
 * against Supabase's JWKS and returns the authenticated user.
 *
 * This is the recommended approach for verifying Supabase tokens on a
 * custom backend — it delegates signature verification to the Supabase SDK.
 */

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type JwksKey = { kid?: string; kty: string; [key: string]: unknown };
let jwksCache: { expiresAt: number; keys: JwksKey[] } | null = null;

async function getJwksKey(kid: string): Promise<string | null> {
  if (!supabaseUrl) return null;
  if (!jwksCache || jwksCache.expiresAt < Date.now()) {
    const jwksUrl = process.env.SUPABASE_JWKS_URL || `${supabaseUrl.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json`;
    const response = await fetch(jwksUrl);
    if (!response.ok) throw new Error(`Supabase JWKS request failed (${response.status}).`);
    const jwks = await response.json() as { keys?: JwksKey[] };
    jwksCache = { keys: jwks.keys || [], expiresAt: Date.now() + 15 * 60 * 1000 };
  }
  const key = jwksCache.keys.find((candidate) => candidate.kid === kid);
  if (!key) return null;
  return createPublicKey({ key: key as any, format: 'jwk' }).export({ type: 'spki', format: 'pem' }).toString();
}

export async function verifySupabaseClaims(accessToken: string): Promise<{ sub: string } | null> {
  const decoded = jwt.decode(accessToken, { complete: true });
  if (!decoded || typeof decoded === 'string') return null;
  const algorithm = decoded.header.alg as Algorithm | undefined;
  if (!algorithm) return null;
  let key: string;
  if (process.env.SUPABASE_JWT_SECRET) {
    if (algorithm !== 'HS256') return null;
    key = process.env.SUPABASE_JWT_SECRET;
  } else {
    if (algorithm !== 'RS256' && algorithm !== 'ES256') return null;
    const kid = decoded.header.kid;
    if (!kid) return null;
    const jwkKey = await getJwksKey(kid);
    if (!jwkKey) return null;
    key = jwkKey;
  }
  const claims = jwt.verify(accessToken, key, {
    algorithms: [algorithm],
    audience: 'authenticated',
    issuer: `${supabaseUrl.replace(/\/$/, '')}/auth/v1`,
  });
  if (typeof claims === 'string' || typeof claims.sub !== 'string' || typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) return null;
  return { sub: claims.sub };
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] SUPABASE_URL or SUPABASE_ANON_KEY is not set. ' +
      'Supabase Auth verification will not work until these are configured.'
  );
}

export const supabaseAuth = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
}) : null;

/**
 * Verifies a Supabase access token and maps it to our User table.
 *
 * 1. Calls supabase.auth.getUser(accessToken) — the SDK verifies the
 *    JWT signature against Supabase's JWKS, checks expiry and audience.
 *    Never trusts a user ID from the client.
 * 2. Looks up the Supabase user by their ID in our User table (supabaseUserId).
 * 3. If not found by supabaseUserId, tries to link by email (only if
 *    Supabase reports the email as verified — prevents account takeover).
 * 4. If no matching user exists, auto-creates a new GUEST user row with
 *    name, email, avatar from Supabase, emailVerified=true, and creates
 *    their EmailPreferences row (marketingOptIn=false).
 *
 * Returns the UserTokenPayload (id, email, role, fullName) from OUR database,
 * or null if the token is invalid/expired.
 */
export async function verifySupabaseToken(
  accessToken: string
): Promise<UserTokenPayload | null> {
  if (!supabaseAuth || !accessToken) return null;
  // Verify signature, expiry, issuer and audience locally using the project's
  // signing key/JWKS, then confirm the session user against Supabase Auth.
  let verifiedClaims: { sub: string } | null;
  try {
    verifiedClaims = await verifySupabaseClaims(accessToken);
  } catch {
    return null;
  }
  if (!verifiedClaims) return null;
  const {
    data: { user: supabaseUser },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !supabaseUser || supabaseUser.id !== verifiedClaims.sub) {
    return null;
  }

  // Extract user metadata from Supabase
  const supabaseUserId = supabaseUser.id;
  const email = supabaseUser.email || '';
  const provider = supabaseUser.app_metadata?.provider || 'email';
  const emailVerified = provider === 'google' || supabaseUser.email_confirmed_at != null;
  const fullName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.user_metadata?.user_name ||
    email.split('@')[0];
  const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

  if (!email) {
    return null;
  }

  // Find or create the user in our database
  const { user, created } = await findOrCreateUserFromSupabase({
    supabaseUserId,
    email,
    emailVerified,
    fullName,
    avatarUrl,
    provider,
  });

  if (!user) {
    return null;
  }

  if (created) await sendWelcomeEmailOnce(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };
}

/**
 * Finds or creates a User row in our database from a Supabase auth user.
 *
 * Linking logic (no data loss, no duplicate accounts):
 * 1. Look up by supabaseUserId — if found, return that row.
 * 2. If not found, look up by email — if found AND the Supabase email is
 *    verified, LINK the existing row by setting supabaseUserId. This preserves
 *    all bookings, receipts, reviews. We never create a duplicate.
 * 3. If no matching user exists, create a new one with role=GUEST.
 *
 * On first-time creation, also:
 *   - Create an EmailPreferences row with marketingOptIn=false
 *   - Set emailVerified=true for Google auth (Google pre-verifies emails)
 *   - Set authProvider to "google" or "email"
 *
 * This function is idempotent — calling it multiple times with the same
 * Supabase user will not create duplicates.
 */
export async function findOrCreateUserFromSupabase(params: {
  supabaseUserId: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  provider: string;
}): Promise<{ user: Awaited<ReturnType<typeof prisma.user.findUnique>>; created: boolean }> {
  const { supabaseUserId, email, emailVerified, fullName, avatarUrl, provider } =
    params;

  // 1. Try to find by supabaseUserId
  let user = await prisma.user.findUnique({
    where: { supabaseUserId },
  });

  if (user) {
    if ((emailVerified && !user.emailVerified) || user.authProvider !== provider || (avatarUrl && user.avatarUrl !== avatarUrl)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(emailVerified ? { emailVerified: true } : {}),
          authProvider: provider,
          ...(avatarUrl ? { avatarUrl } : {}),
        },
      });
    }
    return { user, created: false };
  }

  // 2. Try to link by email (only if Supabase confirmed the email)
  if (emailVerified) {
    user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (user) {
      // Link the existing row — preserve all bookings, receipts, reviews
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseUserId,
          authProvider: provider,
          avatarUrl: avatarUrl || user.avatarUrl,
          emailVerified: true,
        },
      });
      return { user, created: false };
    }
  }

  // 3. No matching user — create a new one
  try {
    user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        // Kept only because the existing schema requires a value. Supabase is
        // the sole login authority; this is not a usable legacy password hash.
        passwordHash: `supabase-only:${supabaseUserId}`,
        fullName,
        role: Role.GUEST,
        emailVerified,
        supabaseUserId,
        authProvider: provider,
        avatarUrl,
        emailPreferences: { create: { marketingOptIn: false, source: 'signup' } },
      },
    });
    return { user, created: true };
  } catch (error: any) {
    // A simultaneous first request may have created this mapping already.
    if (error?.code === 'P2002') {
      const concurrent = await prisma.user.findUnique({ where: { supabaseUserId } });
      if (concurrent) return { user: concurrent, created: false };
      const matchingEmail = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
      // A verified Supabase email can safely link the pre-existing row. An
      // unverified email collision is denied rather than creating a duplicate.
      if (matchingEmail && emailVerified) {
        const linked = await prisma.user.update({ where: { id: matchingEmail.id }, data: { supabaseUserId, authProvider: provider, avatarUrl: avatarUrl || matchingEmail.avatarUrl, emailVerified: true } });
        return { user: linked, created: false };
      }
      if (matchingEmail) return { user: null, created: false };
    }
    throw error;
  }
}
