# Deploy Yahsab on Vercel

The repository can deploy as two Vercel projects connected to the same Git repository. The frontend and API each get their own Vercel URL. Supabase remains the authentication provider only; Yahsab's existing PostgreSQL database remains the application database.

## Create the projects

1. Import this Git repository into Vercel and create the frontend project with **Root Directory** `frontend`. Use the Next.js framework preset. The default install and build commands are suitable (`npm install` and `npm run build`).
2. Import the same repository again as a second project with **Root Directory** `backend`. Use the Express framework preset if Vercel does not detect it automatically. The Express app is exported from `src/app.ts`; set the build command to `npm run build` so TypeScript and Prisma Client are generated. Set Node.js to 20.x or newer.
3. Assign production domains to each project. The frontend domain is the public site; the backend domain serves the API under `/api/v1`.
4. For the backend, choose a Vercel Function region close to the existing PostgreSQL host. Confirm that the database host permits connections from Vercel and supports TLS if required. Keep the existing `DATABASE_URL` value unchanged; do not replace it with a Supabase database URL.

## Project environment variables

Add variables under each Vercel project's **Settings → Environment Variables** for Production and Preview as appropriate. Use actual secrets from your existing services; do not commit them.

Frontend project:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<backend-domain>/api/v1` |
| `NEXT_PUBLIC_SITE_URL` | `https://<frontend-domain>` |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Existing Supabase anon/publishable key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key; use the test key until test payments are verified |

Backend project:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | The exact current application database URL |
| `CLIENT_URL` | `https://<frontend-domain>` |
| `SUPABASE_URL` | Existing Supabase project URL |
| `SUPABASE_ANON_KEY` | Existing Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing Supabase service role key; backend only |
| `SUPABASE_JWKS_URL` | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` (or configure `SUPABASE_JWT_SECRET` for an HS256 project) |
| `COOKIE_SECRET` | A strong random secret |
| `PAYSTACK_SECRET_KEY` | Paystack secret key; use the test key until test payments are verified |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `BREVO_SMTP_HOST` | `smtp-relay.brevo.com` |
| `BREVO_SMTP_PORT` | `587` |
| `BREVO_SMTP_USER` | Brevo SMTP login |
| `BREVO_SMTP_PASSWORD` | Brevo SMTP key |
| `BREVO_FROM` | Verified Brevo sender, e.g. `Yahsab Apartments <reservations@yahsab.com>` |

Add optional configured mail and business variables such as `EMAIL_FROM`, `ADMIN_EMAIL`, and `BUSINESS_SUPPORT_EMAIL` if they are used by your deployment. Never prefix backend secrets with `NEXT_PUBLIC_`.

## Supabase and Google redirect settings

In Supabase **Authentication → URL Configuration**, set **Site URL** to `https://<frontend-domain>` and add `https://<frontend-domain>/auth/callback` to Redirect URLs. Keep `http://localhost:3000/auth/callback` for local development. Add any Vercel Preview callback URLs only if you intend to test OAuth from preview deployments.

In Google Cloud Console, keep the Authorized redirect URI set to the callback shown under Supabase **Authentication → Providers → Google** (normally `https://<project-ref>.supabase.co/auth/v1/callback`). The Google callback is Supabase's URL; the application callback is the frontend `/auth/callback` URL above.

## Safe deployment sequence

1. Deploy the backend with the existing `DATABASE_URL` and verify `https://<backend-domain>/api/v1/health` returns HTTP 200.
2. Set the frontend `NEXT_PUBLIC_API_URL` to that backend URL and deploy the frontend.
3. Update `CLIENT_URL`, Supabase Site URL / Redirect URLs, and Google OAuth origins to the final frontend domain. Redeploy if an environment value changed; `NEXT_PUBLIC_*` values are embedded during the frontend build.
4. Verify login, logout, protected-page redirects, consent, booking, Paystack test payment, webhook, and receipt delivery.

Deployment does not run Prisma migrations or seeds. If a reviewed additive schema migration is pending, take a database backup and run `npx prisma migrate deploy` deliberately against the existing database before deploying code that requires it. Never use `prisma migrate reset`, `db push --force-reset`, or a seed command on the production database.

## Serverless behavior

Vercel runs the Express app as a Function, not as a process that stays alive between requests. It is suitable for request/response API endpoints, but in-process timers and background workers will not be reliable. The current backend has no reminder scheduler implementation; if scheduled unpaid-booking reminders are added, use a protected Vercel Cron endpoint or an external scheduler and make the job idempotent. Function requests also have a maximum execution duration, so handlers should not rely on long-running work.

## Vercel CLI alternative

The dashboard flow above is recommended for linking the two projects. After linking each project, run commands from the corresponding directory:

```bash
cd frontend
vercel link
vercel --prod

cd ../backend
vercel link
vercel --prod
```

Each `vercel link` should select the project whose Root Directory matches the current directory.
