# FishBooker Technical Documentation Status

Last reviewed: 2026-04-21

## Current Project State

The repository is past the bootstrap stage and already has a working MVP slice:

- Laravel 13 API with Sanctum token login
- public slot listing
- admin slot CRUD API
- admin slot management page in the frontend
- authenticated booking history API
- authenticated booking history page in the frontend
- booking creation with a 15-minute hold and expiry recovery
- Next.js 16 customer-facing page for browse, login, and booking

The repository is not yet at the payment, finance, reporting, or admin dashboard stage.
The repository now has an operational admin slot control page and a booking history page, but not a broader analytics dashboard.

## Documentation Audit Result

### Synchronized now

- `docs/api.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/frontend-roadmap.md`
- `docs/local-dev-setup.md`
- `docs/roadmap.md`
- `docs/runbook.md`
- `docs/openapi.yaml`
- `docs/DESIGN.md`
- `docs/design-intent.json`

### Still intentional planning documents

- `docs/admin-requirements.md`
- `docs/architecture-decision-record.md`

These two documents describe target product direction and architectural intent.
They are not implementation inventories.

## Main Corrections Made

The documentation previously overstated the current system in several areas.
The refreshed docs now remove or clearly mark these items as not implemented:

- payment gateway integration
- payment webhooks
- finance and reporting tables
- admin analytics UI
- custom operational Artisan commands that do not exist
- non-existent health endpoint examples under `/api/health`

## Evidence Used

Implementation audit:

- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/*.php`
- `backend/database/migrations/*.php`
- `frontend/app/page.tsx`
- `frontend/app/bookings/page.tsx`
- `frontend/components/*.tsx`
- `frontend/proxy.ts`
- `frontend/lib/api.ts`

Regression evidence:

- `backend/tests/Feature/Api/AdminSlotManagementTest.php`
- `backend/tests/Feature/Api/BookingFlowTest.php`

## Recommended Documentation Discipline

1. Treat `docs/openapi.yaml` as the API contract source of truth.
2. Keep `docs/architecture.md` focused on what exists, not what may exist later.
3. Use roadmap and requirements documents for future work, not implementation claims.
4. Update docs in the same change whenever routes, payloads, or schema change.
