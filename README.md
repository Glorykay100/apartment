# Yahsab Luxury Apartments & Suites

A boutique short-let and apartment booking platform for Nigeria, built with a Next.js frontend, Express + Prisma backend, PostgreSQL database, JWT authentication, and Paystack test-mode payments.

## Project overview

- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: PostgreSQL (local, Neon, or Supabase)
- Auth: JWT in HTTP-only cookies, bcrypt password hashing
- Payments: Paystack test mode
- Email: Nodemailer via SMTP
- Storage: Cloudinary-ready image handling
- Testing: Vitest backend tests for booking and auth flows

## Folder structure

```text
apartment/
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── DESIGN.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── PULL_REQUEST_TEMPLATE.md
├── package.json
└── README.md
```

## API endpoint map

Base URL: http://localhost:5000/api/v1

### Auth
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/forgot-password

### Apartments
- GET /apartments
- GET /apartments/:slug
- GET /apartments/:id/availability

### Bookings
- POST /bookings/calculate-quote
- POST /bookings
- GET /bookings/my-bookings
- GET /bookings/:reference
- POST /bookings/:id/cancel

### Payments
- POST /payments/initialize
- GET /payments/verify/:reference
- POST /payments/webhook

### Contact
- POST /contact

### Health
- GET /health

## Data model summary

Core entities include:
- User
- Apartment
- ApartmentImage
- Amenity
- Booking
- BlockedDate
- Review
- ContactMessage

Important rules:
- Roles: GUEST and ADMIN
- Bookings are date-driven and reject overlapping dates using transactional checks
- Booking references follow the pattern: YAH-YYYY-XXXX
- Payment status is server-calculated and never trusted from the client

## Design concept

The project follows a warm, boutique hospitality direction inspired by modern African architecture and design. The look is based on natural neutrals, deep forest green accents, terracotta highlights, editorial typography, and generous spacing. See the detailed design guidance in [docs/DESIGN.md](docs/DESIGN.md).

## Local setup

### 1) Install dependencies

```bash
cd apartment
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables

Copy the example files and update the secrets:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3) Prepare the database

```bash
cd backend
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4) Run the apps

```bash
# From the root
npm run dev:backend
npm run dev:frontend
```

Frontend: http://localhost:3000
Backend: http://localhost:5000/api/v1

## Useful scripts

### Root
```bash
npm run dev:backend
npm run dev:frontend
npm run build:backend
npm run build:frontend
npm run test:backend
npm run prisma:seed
```

### Backend
```bash
npm run dev
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm test
```

### Frontend
```bash
npm run dev
npm run build
npm run start
```

## Deployment guide

### Frontend on Vercel
1. Import the repo into Vercel.
2. Set the project root to the monorepo root.
3. Set the framework to Next.js and use the frontend app as the app directory or project root if configured separately.
4. Add environment variables:
   - NEXT_PUBLIC_API_URL
   - NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
   - NEXT_PUBLIC_SITE_URL
5. Enable automatic deploys from main and preview deploys from pull requests.

### Backend on Render or Railway
1. Create a new web service from the backend folder.
2. Use the provided Dockerfile or the Node start command.
3. Add environment variables for the database, JWT secret, Paystack key, email credentials, and CORS domain.
4. Run database migrations during deployment:
   ```bash
   npx prisma migrate deploy
   npm run prisma:seed
   ```
5. Configure CORS to allow the frontend domain.

### Database on Neon or Supabase
1. Create a PostgreSQL database on Neon or Supabase.
2. Copy the connection string into DATABASE_URL.
3. Run Prisma migrations and seed the database.

### Paystack webhook setup
- Set the webhook URL to:
  ```text
  https://<your-backend-domain>/api/v1/payments/webhook
  ```
- Enable the webhook and use the secret key from Paystack test mode.

## Environment variables

### Backend (.env)
- PORT
- NODE_ENV
- CLIENT_URL
- DATABASE_URL
- JWT_SECRET
- JWT_EXPIRES_IN
- COOKIE_SECRET
- PAYSTACK_SECRET_KEY
- PAYSTACK_PUBLIC_KEY
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- EMAIL_FROM
- ADMIN_EMAIL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET

### Frontend (.env.local)
- NEXT_PUBLIC_API_URL
- NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
- NEXT_PUBLIC_SITE_URL

## Branching and release workflow

This project follows the branch structure in [CONTRIBUTING.md](CONTRIBUTING.md):

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<name>
# make changes
git add .
git commit -m "feat(<scope>): description"
git push -u origin feature/<name>
# open PR into develop
# merge when approved
```

For a release:

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0
git tag v1.0.0
git push origin release/v1.0.0 --tags
git checkout main
git merge --no-ff release/v1.0.0
```

Branch graph:

```bash
git log --oneline --graph --all
```

## Testing checklist

- Health route returns 200
- Auth register/login/logout works
- Booking quote validation rejects invalid date ranges
- Overlapping bookings are blocked
- Paystack initialization and verification succeed in test mode
- Admin login works for seeded admin user
- Contact form stores messages
- Mobile view remains usable

## Live URLs

- Frontend: TBD
- Backend API: TBD
- Admin dashboard: TBD

## Screenshot section

Add screenshots here after each deployment milestone.

## Presentation cheat-sheet

Suggested walkthrough order:
1. Open the landing page and explain the boutique hospitality concept.
2. Show the apartment listing and filter flow.
3. Open an apartment detail page and highlight the date-based availability logic.
4. Show booking quote and payment flow.
5. Demonstrate the seeded admin account and booking management.
6. Explain the API + Prisma architecture and deployment plan.

## Notes for class defense

- Backend price calculation happens on the server so the client cannot manipulate totals.
- Booking overlap prevention is enforced with Prisma transaction checks, not only frontend validation.
- JWT is stored in an HTTP-only cookie to reduce XSS risk.
- The project is intentionally free-tier compatible, using common managed services and test keys instead of production credentials.
- The app is structured as a monorepo to keep frontend and backend responsibilities clearly separated.
