# QA report

## Execution summary

| Area | Result | Evidence |
|---|---|---|
| Backend Vitest/Supertest | PASS | `npm run test:backend`: 7 files, 35 tests passed. Run against a temporary PostgreSQL 16 cluster and the dedicated `yahsab_test` database. The runner resets and seeds before the suite, then resets again in `finally`-style cleanup. |
| Backend TypeScript | PASS | `npx tsc --noEmit` in `backend` exited 0. |
| Frontend TypeScript | PASS | `npx tsc --noEmit` in `frontend` exited 0. |
| Backend production build | PASS | `npm run build` in `backend` exited 0. |
| Frontend production build | PARTIAL | Next compiled and generated 23 routes, but printed `Your project has an older version of ESLint installed (6.4.0). Please upgrade to ESLint version 7 or above`. A clean lint/build result is not established. |
| Frontend lint | FAIL | `npm run lint` prompted for ESLint setup; after adding the Next recommended config, it failed because the installed ESLint version is 6.4.0. |
| Playwright, axe, Lighthouse, live-site QA | NOT RUN | Dependencies/browser tooling and a live-site URL/credentials were unavailable in this run. No browser report or screenshots were produced. |
| Email delivery | NOT RUN | Test sends are simulated. No real Brevo send was performed. |
| npm audit / secret-history scan | NOT RUN | No successful audit or complete history scan was obtained. |

## Backend feature matrix

The currently executed backend suite predates the requested full endpoint matrix. Rows marked **NOT COVERED** are not claims of correctness.

| Feature | Tests covering it | Result | Bugs found/fixed |
|---|---|---|---|
| Health and unknown API route | `health.test.ts` (2) | PASS | None. |
| Published apartment list, city/price filters, featured list, detail, availability, missing slug | `apartment.test.ts` (7) | PASS | None. |
| Quote calculation and invalid date order | `booking.test.ts` (2) | PASS | None. |
| Authenticated reservation, overlap conflict, initialize and verify payment | `booking.test.ts` (3) | PASS | Updated old fixtures to authenticate and accept current consent. |
| Paystack invalid signature, successful/duplicate webhook, amount mismatch, expired hold, unique initialization reference | `paystack.test.ts` (6) | PASS | Updated tests to authenticate on booking and initialization. |
| Supabase missing/forged/expired tokens, authorization, consent middleware, user create/link | `supabase-auth.test.ts` (8), `supabase-jwt.test.ts` (4) | PASS | None. |
| Legacy auth endpoints | `auth.test.ts` (3) | PASS | None. |
| Admin apartment mutations/uploads, booking ownership and cancellation, all endpoint validation/role matrix, simultaneous date collision, refunds, full consent lifecycle, email retry/content, subscription/bounce, reviews, contact, dashboard, jobs, rate limiting, CORS and security headers | None in executed suite | NOT COVERED | Not investigated by this run. |

## Test isolation and reproducibility

`backend/scripts/test-backend-safe.cjs` refuses a URL unless it points to loopback and the database is exactly `yahsab_test`. It sets test mode and placeholder Paystack test keys, resets the schema, seeds known users and apartments, runs Vitest serially, and resets the schema afterward. `backend/.env.test` is ignored by Git. Never copy a production `DATABASE_URL` into it.

Git commands used to establish the requested branch:

```sh
git switch -c feature/testing-qa
git status --short --branch
```

The suite’s actual passing output was:

```text
Test Files  7 passed (7)
     Tests  35 passed (35)
Duration   46.02s
```

## Coverage, screenshots, and manual checks

Backend line/branch coverage was not collected, so no coverage percentage is available. No Playwright screenshots or HTML report exist because Playwright did not install and no browser suite ran. No reliable claim can be made about responsive behavior, accessibility, Lighthouse, broken links, browser console output, or complete booking/payment journeys.

Manual follow-up checklist:

- Verify Google OAuth redirect and callback on the live site.
- Verify Paystack TEST-mode webhook delivery in the Paystack dashboard.
- Send one real receipt and one unpaid reminder through Brevo to the intended inbox; check SPF and DKIM pass, inbox placement, correct amounts, and attached PDF.
- Run the full browser journey suite against a dedicated seeded staging deployment, tag created records, and delete them afterward.
- Run npm audit and a repository plus Git history secret scan.
