# FishBooker Operations Runbook

Last reviewed: 2026-04-22

## Scope

This runbook covers the commands and checks that are supported by the codebase today.
Older references to custom booking maintenance commands have been removed because those commands do not exist in this repository.

## Start the Local Stack

```bash
cd backend
./vendor/bin/sail up -d
```

To stop the stack:

```bash
cd backend
./vendor/bin/sail down
```

## Health Checks

Application health endpoint:

```bash
curl -i http://localhost:8000/up
```

Slot API check:

```bash
curl http://localhost:8000/api/v1/slots
```

Login API check:

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Database Operations

Reset schema and seed data:

```bash
cd backend
./vendor/bin/sail artisan migrate:fresh --seed
```

Run tests:

```bash
cd backend
./vendor/bin/sail artisan test
```

## Frontend Operations

Install dependencies:

```bash
cd frontend
npm install
```

Run development server:

```bash
cd frontend
npm run dev
```

Lint:

```bash
cd frontend
npm run lint
```

Build:

```bash
cd frontend
npm run build
```

## Logs and Diagnostics

Laravel logs:

```bash
tail -f backend/storage/logs/laravel.log
```

List running Sail containers:

```bash
cd backend
./vendor/bin/sail ps
```

Restart Sail services:

```bash
cd backend
./vendor/bin/sail restart
```

## Incident Notes

### Backend is unreachable from the frontend

- Confirm `./vendor/bin/sail up -d` is running
- Confirm the browser can reach `http://localhost:8000`
- Confirm `NEXT_PUBLIC_API_BASE_URL` points to the backend host

### Booking requests fail with auth errors

- Log in again from the frontend header dialog
- Confirm the Next.js app can read its HTTP-only auth cookies
- Confirm the BFF route handlers can still call `GET /api/v1/auth/me`
- Confirm the user exists and the database was seeded

### Payment page does not move from pending

- Confirm `MANUAL_PAYMENT_WEBHOOK_SECRET` matches in both `frontend/.env` and `backend/.env`
- Confirm the payment row exists in the `payments` table
- Confirm webhook calls are reaching `POST /api/v1/payments/webhooks/manual`
- Check `payment_webhook_events` and `financial_journals` for settlement evidence

### Booking lock behavior looks wrong

- Check the selected cache driver in the Laravel environment
- Prefer a lock-capable driver such as Redis for realistic concurrency behavior
- Reset the database and retry with a clean state if needed
