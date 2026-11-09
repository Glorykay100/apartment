import { type NextRequest, NextResponse } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

/**
 * Next.js middleware for Supabase session refresh and protected route protection.
 *
 * 1. Refreshes the Supabase auth session on every request (cookie-based).
 * 2. Redirects unauthenticated users to /auth/login for protected routes,
 *    preserving the original URL as a `redirect` query param so the user
 *    can be returned after login.
 * 3. Redirects authenticated users away from auth pages (login/register)
 *    to the dashboard.
 *
 * Protected routes:
 *   - /dashboard
 *   - /admin
 *   - /booking/checkout, /booking/payment, /booking/confirmation
 *
 * Auth routes (redirect to dashboard if already logged in):
 *   - /auth/login, /auth/register
 *
 * Note: /auth/callback is NOT protected — it handles the OAuth exchange.
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/booking/checkout',
  '/booking/payment',
  '/booking/confirmation',
];

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
];

async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  // Refresh the session — this updates cookies if needed
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  // Check if the current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Check if the current route is an auth page
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/.*).*)',
  ],
};
