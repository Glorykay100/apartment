# QA report

## Execution summary

This report records commands run in this QA session. Passing a narrow test is not evidence that an untested feature works.

| Check | Result | Evidence |
|---|---|---|
| Backend API tests | PASS | `npm run test:backend`: **7 files passed, 35 tests passed**, Vitest 2.1.9, 47.25s. Ran against a disposable PostgreSQL 16 cluster at `127.0.0.1:55432`, database `yahsab_test`; seeded known records before the run and reset the database after it. Emails were simulated. Paystack credentials were test-mode placeholders. |
| Backend typecheck | PASS | `npm run typecheck:backend` exited 0. |
| Frontend typecheck | PASS | `npm run typecheck:frontend` exited 0. |
| Backend production build | PASS | `npm run build:backend` exited 0, including Prisma Client generation. |
| Frontend production build | PARTIAL | Next compiled and generated 23 routes, but emitted `error - Your project has an older version of ESLint installed (6.4.0). Please upgrade to ESLint version 7 or above`. The command exited 0; lint is still broken. |
| Frontend lint | FAIL | `npm run lint` exited 1 with the same ESLint 6.4.0 compatibility error. Installing the required ESLint dependencies did not complete in the available network session; package files were not changed. |
| Frontend/backend Playwright | NOT RUN | No Playwright dependency, test suite, browser report, or screenshots were available. `npm run test:e2e` is wired at the root but the frontend script is absent. |
| Lighthouse, axe, link/console checks | NOT RUN | No browser run was completed. |
| npm audit, backend | FAIL / findings returned | `npm audit --prefix backend --audit-level=high` reported **10 vulnerabilities: 3 high and 2 critical**, plus 3 moderate and 2 low. Findings include Nodemailer and Vitest dependency chains. npm proposed breaking upgrades for some findings; no automatic upgrades were applied. |
| npm audit, frontend | NOT ESTABLISHED | Registry access did not return a completed result. Root package has no lockfile; frontend has its own lockfile. |
| Secret scan | No matches found in checked scope | Searched the working tree for common live-key/private-key patterns and tracked Git history paths for env/secret/credential/key filenames. This is a pattern scan, not a claim of exhaustive secret detection. |
| Live-site checks | NOT RUN | No live frontend/backend URLs or approved staging credentials were provided. |
| Brevo real-send check | NOT RUN | No real message was sent. Tests use simulated email output; no real inbox was identified or authorized for a send. |

## Backend feature matrix

| Feature | Tests covering it | Result | Bugs found/fixed |
|---|---|---|---|
| Health and unknown API route | `health.test.ts` (2) | PASS | None. |
| Apartment published list, filters, featured list, detail, missing slug | `apartment.test.ts` (7) | PASS | None. Admin mutations, image upload, complete filtering/sorting and endpoint role/validation matrix are not covered. |
| Quote calculation and invalid date order | `booking.test.ts` (2) | PASS | None. Client total tampering and blocked dates are not covered. |
| Authenticated reservation, overlapping reservation, initialize and verify payment | `booking.test.ts` (3) | PASS | None. Simultaneous collision requests, hold edge cases and all booking ownership/cancellation paths are not covered here. |
| Paystack webhook signature, successful confirmation, duplicate event, amount mismatch, expired hold, initialization reference | `paystack.test.ts` (6) | PASS | None. Currency mismatch, failed/abandoned transactions and every verify error path are not covered. |
| Supabase token verification and middleware | `supabase-auth.test.ts` (8), `supabase-jwt.test.ts` (4) | PASS | Current tests cover representative missing/forged/expired/valid token and role/consent cases; they do not constitute the requested full endpoint matrix. |
| Legacy auth endpoints and `/me` unauthenticated response | `auth.test.ts` (3) | PASS | None. First-login idempotency, same-email linking, signup/login integration and authenticated `/me` are not covered. |
| Consent, receipts, unpaid email schedules/retries, welcome email | No dedicated tests in the executed suite | NOT COVERED | No fixes claimed. |
| Subscribe/unsubscribe, consent token, suppression/bounce | No dedicated tests in the executed suite | NOT COVERED | No fixes claimed. |
| Reviews, contact form, dashboard stats, admin CRUD, manual date blocking, jobs secret/idempotency | No dedicated tests in the executed suite | NOT COVERED | No fixes claimed. |
| Rate limits, CORS rejection, Helmet headers, response/log secret checks | No dedicated tests in the executed suite | NOT COVERED | No fixes claimed. |
| Backfill and user-linking script dry runs/idempotency | No dedicated tests in the executed suite | NOT COVERED | No fixes claimed. |

Backend coverage percentage was not collected. The 35 passing tests do not yet exercise all API endpoints or the requested success/validation/401/403/404 matrix.

## Frontend browser journeys and email

No Playwright suite ran, so there are no browser pass counts or failure screenshots, and no Playwright HTML report. Cookie consent, public pages, booking/terms/payment journeys, account flows, admin workflows, responsive viewports, keyboard-only booking and accessibility automation remain unverified.

No email templates were rendered in this run. Plain-text alternatives, links, business details, mobile layout and marketing unsubscribe placement remain unverified. Test logs showed simulated confirmation email output only; no Brevo request was made.

## Reproducible commands and observed output

The branch was already `feature/testing-qa` when this session began. The isolated test runner loaded `backend/.env.test`, enforced loopback plus database name `yahsab_test`, overrode Paystack credentials with `sk_test_`/`pk_test_` placeholders, reset and seeded before Vitest, and reset after Vitest.

Backend suite output:

```text
Test Files  7 passed (7)
     Tests  35 passed (35)
Duration   47.25s
```

Typechecks and backend build:

```text
npm run typecheck:backend       PASS (exit 0)
npm run typecheck:frontend      PASS (exit 0)
npm run build:backend           PASS (exit 0)
```

Frontend lint output:

```text
error - Your project has an older version of ESLint installed (6.4.0). Please upgrade to ESLint version 7 or above
```

## Manual follow-up checklist

- Fix the frontend ESLint dependency/configuration, then rerun lint and production build.
- Add and run the requested Playwright suite on desktop and mobile; retain screenshots for failures and the HTML report.
- Add endpoint/feature coverage for the rows marked NOT COVERED and collect backend coverage.
- Address the backend audit findings with compatible dependency upgrades, then rerun tests and `npm audit`.
- Run axe, Lighthouse on home and apartment detail (target at least 85 in each category), keyboard-only booking, and broken-link/console checks.
- Verify Google OAuth redirect/callback on the live site.
- Verify Paystack TEST-mode webhook delivery from the Paystack dashboard.
- Send one real receipt and one unpaid reminder to the owner-designated inbox through Brevo; confirm SPF/DKIM pass, inbox placement, correct content, and receipt PDF attachment. This was not done because no destination inbox was designated.
- If running against a deployed test environment, tag created records and delete them after smoke tests.
