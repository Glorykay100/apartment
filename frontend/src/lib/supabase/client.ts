import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for browser (client components).
 *
 * Uses createBrowserClient from @supabase/ssr which handles cookie-based
 * session management automatically. Only the anon key is used here —
 * the service role key is NEVER available in the browser.
 *
 * Required env vars (prefixed with NEXT_PUBLIC_ so they reach the browser):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
