import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Creates a Supabase client for server components.
 *
 * Uses createServerClient from @supabase/ssr which reads and writes
 * auth cookies for session management in Next.js server components.
 *
 * Usage in a server component:
 *   import { createSupabaseServerClient } from '@/lib/supabase/server';
 *   const supabase = createSupabaseServerClient();
 *   const { data: { session } } = await supabase.auth.getSession();
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client for route handlers.
 *
 * In route handlers we need to return the response so cookies can be set.
 * This version returns both the client and a response object.
 *
 * Usage in a route handler:
 *   import { createSupabaseRouteClient } from '@/lib/supabase/server';
 *   const { supabase, response } = createSupabaseRouteClient(request);
 *   const { data: { session } } = await supabase.auth.getSession();
 *   return response;
 */
export function createSupabaseRouteClient(request: NextRequest) {
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
