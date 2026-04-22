# FishBooker Technical Documentation Status

Last reviewed: 2026-04-22

## Current Project State

The repository is now beyond the original MVP slice and includes:

- Laravel 13 API with Sanctum token login
- HTTP-only frontend-managed auth session for Next.js route gating
- public slot listing
- admin slot CRUD API and admin slot management page
- authenticated booking history API and frontend page
- booking creation with a 15-minute hold and expiry recovery
- payment creation for pending bookings
- signed manual webhook processing
- payment-to-booking settlement and finance journal writes
- admin analytics dashboard and finance CSV export
- Next.js payment page with sandbox transfer simulation and cash flow support

## Documentation Audit Result

### Synchronized now

- `docs/api.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/openapi.yaml`
- `docs/runbook.md`
- `docs/DESIGN.md`
- `docs/design-intent.json`

### Still intentional planning documents

- `docs/admin-requirements.md`
- `docs/architecture-decision-record.md`
- `docs/roadmap.md`

These documents still describe product direction, but the implementation inventory now includes payment, reporting, and admin analytics foundations in code.

## Main Corrections Made

The current docs now reflect that the repository includes:

- payment initiation records
- manual webhook processing
- finance journal storage
- admin dashboard API and frontend
- backend-supported HTTP-only auth trust on the frontend

Remaining non-implemented areas are mostly provider-specific or production-hardening concerns, not the core feature slice itself.

## Evidence Used

Implementation audit:

- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/*.php`
- `backend/app/Services/**/*`
- `backend/database/migrations/*.php`
- `frontend/app/api/**/*`
- `frontend/app/admin/dashboard/page.tsx`
- `frontend/app/payments/[reference]/page.tsx`
- `frontend/features/admin-dashboard/**/*`
- `frontend/features/payments/**/*`
- `frontend/proxy.ts`

Regression evidence:

- `backend/tests/Feature/Api/ApiAuthenticationTest.php`
- `backend/tests/Feature/Api/BookingFlowTest.php`
- `backend/tests/Feature/Api/PaymentWorkflowTest.php`
- `frontend` lint and TypeScript checks

## Recommended Documentation Discipline

1. Treat `docs/openapi.yaml` as the API contract source of truth.
2. Keep `docs/architecture.md` focused on implemented runtime flow, not tentative ideas.
3. When swapping the manual payment provider for a real provider, update API, runbook, and data-model docs in the same change.
4. Keep frontend auth docs explicit about the split between HTTP-only session trust in Next.js and Sanctum as the final backend authority.
