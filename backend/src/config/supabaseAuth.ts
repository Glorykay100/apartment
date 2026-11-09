import { createClient } from '@supabase/supabase-js';

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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
