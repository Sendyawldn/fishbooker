# FishBooker Delivery Roadmap

Last reviewed: 2026-04-23

## Current Delivery Summary

FishBooker has completed the MVP foundation for:

- slot inventory and public availability
- token-based backend auth plus HTTP-only frontend session trust
- admin slot CRUD at the API level
- admin slot control in the frontend
- admin booking operations console for pending-hold cancellation
- booking governance controls for kill switch, hold limit, and customer blacklist
- booking history API and frontend route
- booking holds with 15-minute expiry logic
- payment creation and Midtrans/manual webhook settlement
- finance journal storage and admin analytics dashboard
- a customer-facing frontend to browse and book slots

## Delivery Stages

### Stage 0: Foundation

Status: done

Evidence:

- Laravel 13 backend and Next.js 16 frontend are in place
- local Sail stack is configured
- architecture decision record exists
- seeders and core API tests exist

### Stage 1: Booking MVP

Status: done

Evidence:

- `GET /api/v1/slots`
- `POST /api/v1/bookings`
- booking hold expiry handling
- interactive pond map in the frontend

### Stage 2: Access Control and Admin Operations

Status: done for current scope

Done:

- Sanctum token login
- HTTP-only signed route trust in Next.js
- admin-only middleware
- admin slot create, update, and delete API
- admin slot route in the frontend
- booking history endpoint and route
- admin dashboard route and analytics API

### Stage 3: Payments and Booking Completion

Status: done for Midtrans sandbox plus manual cash fallback

Delivered:

- payment creation per pending booking
- Midtrans sandbox checkout handoff
- Midtrans and manual webhook handling
- transition from `PENDING` to `SUCCESS`
- cash confirmation flow for admin

### Stage 4: Reporting and Operations

Status: partial

Delivered:

- revenue and occupancy reporting
- financial journal tables
- operational CSV export

Still missing:

- broader maintenance workflows beyond manual slot status edits
- richer booking operations console beyond pending-hold cancellation

### Stage 5: Hardening and Release Readiness

Status: partial

Delivered:

- frontend route recovery states (`loading`, `error`, `not-found`)
- frontend unit test runner baseline
- GitHub Actions CI for frontend and backend
- structured logging on critical auth, booking, and payment flows
- backend payment health check command with optional webhook alerting
- deployment notes for environment and release posture
- release-readiness workflow and contract artifact upload

Still missing:

- production Midtrans credential rollout
- platform-specific alert routing and dashboards
- broader frontend test depth beyond current baseline
- API contract publishing automation beyond artifact upload

## Recommended Next Steps

1. Replace Midtrans sandbox credentials with production credentials.
2. Wire `payments:health-check` and structured logs into the chosen alerting platform.
3. Commit and enable the prepared GitHub Actions release workflows.
4. Publish the OpenAPI contract automatically in CI or release workflows.
