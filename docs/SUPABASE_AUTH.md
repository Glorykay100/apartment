# Supabase Auth setup and deployment

Supabase is used for authentication only. The application continues to use the PostgreSQL database already configured by `backend/.env` and `DATABASE_URL`. No Supabase database tables are queried by the Yahsab application.

## Supabase dashboard

1. Create a Supabase project for Auth. Keep its project database separate from Yahsab's application database.
2. Open **Authentication → URL Configuration**. Set **Site URL** to `https://<your-live-frontend-domain>`. Add these exact **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://<your-live-frontend-domain>/auth/callback`
3. Open **Authentication → Providers → Google**, enable Google, and leave the callback URL shown on that page visible for the next section.
4. Open **Project Settings → API**. Copy the Project URL, anon/public key, and service-role key. Put the URL and anon key in the frontend environment; put the URL, anon key and service-role key in the backend environment. The service-role key must never be placed in frontend variables or committed to Git.
5. Under **Authentication → URL Configuration**, keep email confirmation enabled. Under **Authentication → SMTP Settings**, enable custom SMTP and use Brevo (details below).

The backend verifies every bearer token with the configured Supabase signing key: `SUPABASE_JWT_SECRET` for HS256 projects, or the project's JWKS endpoint (default `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`; optionally set `SUPABASE_JWKS_URL`). It also confirms the user with Supabase Auth. The `aud` must be `authenticated`, the issuer must match the configured project, and the token must be unexpired.

## Google Cloud Console

1. Open Google Cloud Console and create a project such as **Yahsab Apartments**.
2. Open **Google Auth Platform → Branding** (or the OAuth consent screen setup). Set the app name to **Yahsab Apartments**, choose the support email, and add the live homepage, `https://<your-live-frontend-domain>/privacy`, and `https://<your-live-frontend-domain>/terms`. Verify the domain if Google requests it. Request only the default `openid`, `email`, and `profile` scopes.
3. Under **Google Auth Platform → Audience**, select **External**. While testing, add each tester as a test user.
4. Open **Clients → Create client**, select **Web application**, and name it **Yahsab Supabase Auth**. Add Authorized JavaScript origins `http://localhost:3000` and `https://<your-live-frontend-domain>`.
5. In **Authorized redirect URIs**, add the exact URI displayed in Supabase's Google provider settings, normally `https://<project-ref>.supabase.co/auth/v1/callback`. Create the client and copy its ID and secret into the Supabase Google provider form. Save both dashboards.
6. Before public launch, change the Google consent screen from **Testing** to **In production**. While it remains in Testing, only listed test users can sign in.

## Brevo for Supabase verification and password-reset emails

Yahsab's application welcome and booking emails use Brevo. Supabase Auth sends signup verification and password-reset emails. Configure Supabase's **Authentication → SMTP Settings** with:

- Host: `smtp-relay.brevo.com`
- Port: `587`
- Username: the SMTP login shown in Brevo
- Password: the Brevo SMTP key (not the API key)
- Sender email: a verified sender in Brevo
- Sender name: `Yahsab Apartments`

Save the settings, then edit Supabase's **Authentication → Email Templates** for Yahsab branding and callback links. Supabase's built-in email service is best-effort, sends only to project team addresses, and is currently limited to 2 emails per hour. Custom SMTP removes that built-in 2/hour limit; Supabase applies a 30/hour starting limit to custom SMTP, adjustable in **Authentication → Rate Limits**. Check the current dashboard limit before a demo. [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Render environment

`render.yaml` defines separate frontend and backend services and deliberately does not create a database. Keep the existing `DATABASE_URL` value exactly as it is in the current backend deployment.

Frontend service:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL=https://<backend-render-host>/api/v1`
- `NEXT_PUBLIC_SITE_URL=https://<your-live-frontend-domain>`

Backend service:

- Existing `DATABASE_URL` (unchanged)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET` for HS256, or `SUPABASE_JWKS_URL` for a custom JWKS endpoint (leave unset to use the project's default JWKS URL)
- `CLIENT_URL=https://<your-live-frontend-domain>`
- Existing Paystack and Brevo SMTP variables

Only the frontend URL and anon key use the `NEXT_PUBLIC_` prefix. Run `npx prisma migrate deploy` from the backend service when a reviewed migration is pending. Do not run a seed script during deployment.

## Existing-user linking

Preview the database rows without writing to Supabase or PostgreSQL:

```bash
cd backend
npx tsx scripts/link-existing-users-to-supabase.ts --dry-run
```

After configuring Supabase and Brevo, run:

```bash
npx tsx scripts/link-existing-users-to-supabase.ts
```

The script imports supported bcrypt hashes into Supabase Auth, provisions the existing account, and writes only `User.supabaseUserId` in Yahsab PostgreSQL. It leaves the original `passwordHash` and all other user fields untouched. Supabase Auth supports bcrypt imports, so this is the chosen path for the application's bcrypt hashes; local password verification is disabled and subsequent checks happen only through Supabase Auth. [Supabase password hash migration guidance](https://supabase.com/kb/guides/migrate-from-auth0). If a hash is not a supported bcrypt format, the script provisions the account without a password and sends the user a Brevo email saying **“Set your password or continue with Google”** with a password setup link. If an existing row is marked unverified, it remains unverified in Yahsab and receives a Supabase-generated verification/setup link delivered through Brevo. Standard signup and reset messages are sent by Supabase through the configured Brevo SMTP relay. The seeded admin row is linked by ID and its existing `ADMIN` role remains authoritative in PostgreSQL.

## Database safety and migration record

The additive migration already present in this repository is:

```sql
ALTER TABLE "User"
  ADD COLUMN "authProvider" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "supabaseUserId" TEXT;

CREATE UNIQUE INDEX "User_supabaseUserId_key"
  ON "User"("supabaseUserId");
```

All three fields are nullable. `prisma migrate status` reported the configured database up to date; no migration ran during the current auth implementation. A local custom-format database dump was taken before current-turn code changes at `backups/yahsab-pre-supabase-auth-2026-11-09.dump` (54,081 bytes). Current row counts: 178 users, 4 bookings, 0 receipts, 1 review. The earlier migration commit recorded 178 users and 4 bookings intact; receipt/review pre-migration counts were not recorded, so this turn cannot make an independent before/after comparison for those two tables.

## Live verification checklist

- [ ] New Google signup creates one `GUEST` row, one email-preferences row with marketing disabled, and one Brevo welcome email.
- [ ] Existing user Google sign-in links the original app row; bookings, receipts and reviews remain attached.
- [ ] Verified email/password signup, email verification, login and password reset complete through Supabase Auth.
- [ ] Logout clears the Supabase session; unauthenticated protected-page visits return to login and then return to the requested page.
- [ ] Terms, Privacy and Refund acceptance blocks the app until all current versions are accepted; acceptance rows include user, version, timestamp, IP and user agent.
- [ ] Test-mode booking, Paystack payment and receipt complete; another user's booking/receipt is inaccessible.
- [ ] A non-admin cannot access admin API routes; the seeded admin retains `ADMIN` in Yahsab PostgreSQL.

Free Supabase projects can pause after roughly a week of low database activity. Before a demo, open the project dashboard and click **Resume project** if it is paused; send a few real requests through the app to confirm it is awake. [Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
