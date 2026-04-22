# Local Development Setup

Last reviewed: 2026-04-22

## Prerequisites

- Docker and Docker Compose support
- Node.js 20 or newer
- npm
- Composer

## Repository Layout

- `backend/`: Laravel API and Sail stack
- `frontend/`: Next.js app
- `docs/`: technical documentation

## Backend Setup

```bash
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate:fresh --seed
```

The backend is available at `http://localhost:8000` when Sail uses the default port mapping.

### Backend Verification

Health check:

```bash
curl -i http://localhost:8000/up
```

Read slots:

```bash
curl http://localhost:8000/api/v1/slots
```

Login with seeded user:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Frontend Setup

```bash
cd frontend
npm install
```

Optional environment file:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
AUTH_SESSION_COOKIE_SECRET=change-this-frontend-session-secret
AUTH_SESSION_MAX_AGE_SECONDS=43200
MANUAL_PAYMENT_WEBHOOK_SECRET=local-manual-payment-secret
```

Run the frontend:

```bash
npm run dev
```

The frontend is available at `http://localhost:3000`.

## Common Commands

Backend tests:

```bash
cd backend
./vendor/bin/sail artisan test
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend production build:

```bash
cd frontend
npm run build
```

Reset database:

```bash
cd backend
./vendor/bin/sail artisan migrate:fresh --seed
```

View Laravel logs:

```bash
tail -f backend/storage/logs/laravel.log
```

## Local Stack Services

The Sail compose file includes:

- application container
- MySQL 8.4
- Redis
- Mailpit

Redis is available in the local stack and should be used for realistic cache-lock behavior in development and production-like environments.

## Known Notes

- The frontend expects the backend to be reachable from the browser, not only from inside Docker.
- The frontend now keeps auth trust in signed HTTP-only cookies and proxies protected API calls through Next.js route handlers.
- The payment sandbox expects `MANUAL_PAYMENT_WEBHOOK_SECRET` in the frontend to match the same secret in `backend/.env`.
