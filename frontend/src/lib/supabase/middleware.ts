import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Creates a Supabase client for use in Next.js middleware.
 *
 * This client reads cookies from the incoming request and writes
 * updated session cookies to the response. It is used to refresh
 * Supabase auth sessions on every request.
 *
 * Usage:
 *   import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';
 *   const { supabase, response } = createSupabaseMiddlewareClient(request);
 *   await supabase.auth.getSession(); // refreshes session
 *   return response;
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}
