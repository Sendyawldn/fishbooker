# FishBooker

FishBooker is a fish pond slot booking project built as a monorepo with a Laravel API and a Next.js frontend.
The current repository delivers an MVP for slot discovery, login, admin slot management at the API level, and booking holds that prevent double booking for 15 minutes.

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

- Sanctum token login endpoint
- public slot listing
- admin slot create, update, and delete API
- admin slot management page in the frontend
- user booking history API and frontend page
- frontend route protection using cookie-backed session and `proxy.ts`
- booking hold flow with expiry recovery
- interactive frontend map and booking modal

## Planned but Not Implemented Yet

- payment gateway integration
- payment webhooks
- finance and reporting modules
- admin dashboard frontend

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
- `docs/roadmap.md`
- `docs/frontend-roadmap.md`
- `docs/runbook.md`
