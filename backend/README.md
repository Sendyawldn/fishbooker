# FishBooker Backend

Laravel 13 API for slot discovery, booking holds, Midtrans sandbox flows, admin booking operations, reporting, and cash confirmation.

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
- admin booking operations with cancel controls
- booking holds with expiry recovery
- Midtrans sandbox checkout plus manual cash confirmation
- finance journal writes and admin reporting
- payment health check command with optional webhook alerting
