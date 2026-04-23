# FishBooker

FishBooker is a fish pond slot booking project built as a monorepo with a Laravel API and a Next.js frontend.
The current repository delivers slot discovery, HTTP-only frontend auth trust, admin slot management, booking holds that prevent double booking for 15 minutes, payment sandbox flows, admin reporting, frontend recovery states, and baseline CI coverage.

## Repository Structure

```text
fishbooker/
|- backend/
|- frontend/
|- docs/
|- README.md
```

## Tech Stack

Backend:

- PHP 8.3+
- Laravel 13
- Laravel Sanctum
- MySQL 8.4 through Laravel Sail
- Redis through Laravel Sail

Frontend:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI and shadcn UI primitives

## Implemented Features

- Sanctum token login plus `auth/me` and logout endpoints
- public slot listing
- admin slot create, update, and delete API
- admin slot management page in the frontend
- user booking history API and frontend page
- frontend route protection using signed HTTP-only cookies and `proxy.ts`
- booking hold flow with expiry recovery
- payment creation for pending bookings
- signed manual webhook settlement
- finance journal writes and revenue reporting API
- admin dashboard frontend with CSV export
- payment page with transfer sandbox simulation and cash confirmation flow
- interactive frontend map and booking modal
- frontend loading, error, and not-found shells for critical routes
- structured route logging for auth, booking, and payment actions
- backend payment health check command
- frontend test runner and GitHub Actions CI

## Next Follow-ups

- swap the manual payment provider to a production gateway
- add deployment-grade observability for payment and webhook failures
- expand reporting exports and operational filters
- harden session/token rotation for production environments

## Local Development

Backend:

```bash
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate:fresh --seed
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run lint
npm test
npm run dev
```

Default local URLs:

- backend: `http://localhost:8000`
- frontend: `http://localhost:3000`

## Main Documentation

- `docs/technical-status.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/openapi.yaml`
- `docs/data-model.md`
- `docs/local-dev-setup.md`
- `docs/deployment.md`
- `docs/roadmap.md`
- `docs/frontend-roadmap.md`
- `docs/runbook.md`
