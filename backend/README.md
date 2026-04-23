# FishBooker Backend

Laravel 13 API for slot discovery, booking holds, payment sandbox flows, admin reporting, and cash confirmation.

## Local Setup

```bash
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate:fresh --seed
```

## Useful Commands

```bash
./vendor/bin/sail artisan test
./vendor/bin/sail artisan payments:health-check
./vendor/bin/sail artisan pail
```

## Current Scope

- Sanctum auth and `auth/me`
- slot CRUD for admin
- booking holds with expiry recovery
- manual webhook payment settlement
- finance journal writes and admin reporting
- payment health check command for stale pending state
