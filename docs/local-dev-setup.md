# Local Development Setup

Last reviewed: 2026-04-23

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
cp .env.example .env.local
```

The default local values now live in `frontend/.env.example`.

For the backend, copy `backend/.env.example` and fill `MIDTRANS_SERVER_KEY` with sandbox credentials when you want to use Midtrans demo checkout.

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

Frontend unit tests:

```bash
cd frontend
npm test
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
- Midtrans sandbox checkout is active when `PAYMENT_PROVIDER=MIDTRANS` and the backend has valid sandbox keys.
