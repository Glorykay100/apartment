import { createClient } from '@supabase/supabase-js';

/**
 * Backend Supabase client using the service role key.
 *
 * This client runs with elevated privileges and must NEVER be exposed
 * to the frontend. It is used for:
 *   - Admin API operations (creating users in the linking script)
 *   - JWT verification via getUser() which checks the access token
 *     against Supabase's own auth store
 *
 * The service role key bypasses RLS — it is server-side only.
 *
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the
 * backend .env file. They are NOT shared with the frontend.
 */

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Supabase Auth features will not work until these are configured.'
  );
}

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
}) : null;
