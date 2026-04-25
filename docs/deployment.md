# FishBooker Deployment Notes

Last reviewed: 2026-04-25

## Scope

This document covers the minimum deployment posture that is now supported by the repository without locking the team to one hosting vendor.

The remaining external activation work is tracked in `docs/external-activation-checklist.md`.

## Supported Topology

- Laravel API as one runtime
- Next.js frontend as one runtime
- MySQL for primary data
- Redis for cache and queue support
- Shared environment contract between frontend and backend for auth cookies and Midtrans/manual payment flows

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
- `PAYMENT_PROVIDER`
- `MANUAL_PAYMENT_PROVIDER`
- `MANUAL_PAYMENT_WEBHOOK_SECRET`
- `MIDTRANS_PAYMENT_PROVIDER`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`
- `MIDTRANS_ENABLED_PAYMENTS`
- `OPERATIONS_ALERT_WEBHOOK_URL`

Frontend:

- `NEXT_PUBLIC_API_BASE_URL`
- `AUTH_SESSION_COOKIE_SECRET`
- `AUTH_SESSION_MAX_AGE_SECONDS`
- `MANUAL_PAYMENT_WEBHOOK_SECRET`

## Release Checklist

1. Run backend tests: `php artisan test`
2. Run frontend checks: `npm run lint && npm test && npm run build`
3. Confirm Midtrans sandbox or production keys match the target environment.
4. Confirm `AUTH_SESSION_COOKIE_SECRET` is unique per environment and not using the development placeholder.
5. Run `php artisan payments:health-check --alert` before and after release when alert webhook delivery is configured.
6. Confirm `GET /up` returns healthy on the deployed backend.
7. Walk through `docs/external-activation-checklist.md` when promoting from sandbox-style staging to real production.

## Observability Baseline

- Collect Laravel application logs from the backend runtime.
- Collect Next.js server logs for auth session/login/logout, customer booking routes, payment detail/simulation routes, and admin BFF routes for dashboard, bookings, customers, customer booking-access mutations, controls, slot mutations, finance export, and cash confirmation.
- Persist request ids from frontend BFF logs when troubleshooting payment or auth flows.
- Alert when `php artisan payments:health-check --alert` exits non-zero.

## Current Limits

- The current production-style provider integration targets Midtrans sandbox/demo credentials until real production credentials are supplied.
- Distributed tracing is not configured yet.
