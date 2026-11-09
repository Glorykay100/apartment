import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

/**
 * OAuth callback route handler.
 *
 * After Supabase completes the OAuth exchange (e.g., Google sign-in),
 * the user is redirected here with a `code` query parameter. This handler
 * exchanges the code for a session and then redirects the user to their
 * original destination or the dashboard.
 *
 * Flow:
 * 1. Supabase redirects to /auth/callback?code=xxx&next=/booking/checkout
 * 2. We exchange the code for a session (sets auth cookies)
 * 3. We redirect to `next` param or /dashboard
 *
 * Error handling:
 * - If code is missing or exchange fails, redirect to /auth/login with error
 */

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth error from provider (e.g., user denied consent)
  if (error) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', error);
    if (errorDescription) {
      loginUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl);
  }

  const { supabase, response } = createSupabaseRouteClient(request);

  // Exchange the code for a session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'exchange_failed');
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to the intended destination or dashboard
  const redirectUrl = new URL(next, request.url);
  return NextResponse.redirect(redirectUrl, {
    headers: response.headers,
  });
}
