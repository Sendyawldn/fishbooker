# FishBooker Deployment Notes

Last reviewed: 2026-04-23

## Scope

This document covers the minimum deployment posture that is now supported by the repository without locking the team to one hosting vendor.

## Supported Topology

- Laravel API as one runtime
- Next.js frontend as one runtime
- MySQL for primary data
- Redis for cache and queue support
- Shared environment contract between frontend and backend for auth cookies and manual payment sandbox

## Required Environment Variables

Backend:

- `APP_ENV`
- `APP_KEY`
- `APP_URL`
- `FRONTEND_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `CACHE_STORE`
- `QUEUE_CONNECTION`
- `MANUAL_PAYMENT_PROVIDER`
- `MANUAL_PAYMENT_WEBHOOK_SECRET`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`
- `AUTH_SESSION_COOKIE_SECRET`
- `AUTH_SESSION_MAX_AGE_SECONDS`
- `MANUAL_PAYMENT_WEBHOOK_SECRET`

## Release Checklist

1. Run backend tests: `php artisan test`
2. Run frontend checks: `npm run lint && npm test && npm run build`
3. Confirm `MANUAL_PAYMENT_WEBHOOK_SECRET` matches between frontend and backend.
4. Confirm `AUTH_SESSION_COOKIE_SECRET` is unique per environment and not using the development placeholder.
5. Run `php artisan payments:health-check` before and after release to catch stale payment state.
6. Confirm `GET /up` returns healthy on the deployed backend.

## Observability Baseline

- Collect Laravel application logs from the backend runtime.
- Collect Next.js server logs for `/api/auth/login`, `/api/bookings`, `/api/bookings/[bookingId]/payments`, `/api/payments/[reference]/simulate`, and admin cash confirmation.
- Persist request ids from frontend BFF logs when troubleshooting payment or auth flows.
- Alert when `php artisan payments:health-check` exits non-zero.

## Current Limits

- The current payment provider is still the manual sandbox adapter.
- Alert routing is not bundled in the repository because it depends on the deployment platform.
- Distributed tracing is not configured yet.
