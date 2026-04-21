# FishBooker Delivery Roadmap

Last reviewed: 2026-04-21

## Current Delivery Summary

FishBooker has completed the MVP foundation for:

- slot inventory and public availability
- token-based login for API access
- admin slot CRUD at the API level
- admin slot control in the frontend
- booking history API and frontend route
- booking holds with 15-minute expiry logic
- a customer-facing frontend to browse and book slots

The project has not implemented payment, financial reporting, or admin analytics yet.

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

Status: partial

Done:

- Sanctum token login
- admin-only middleware
- admin slot create, update, and delete API
- admin slot route in the frontend
- booking history endpoint and route

Still missing:

- analytics dashboard UI
- stronger protected frontend routes with backend-managed session trust
- richer role-aware user flows

### Stage 3: Payments and Booking Completion

Status: not started

Missing:

- payment gateway integration
- payment webhook handling
- transition from `PENDING` to a paid or completed state

### Stage 4: Reporting and Operations

Status: not started

Missing:

- revenue and occupancy reporting
- financial journal tables
- operational exports
- maintenance workflows beyond manual slot status edits

### Stage 5: Hardening and Release Readiness

Status: not started

Missing:

- frontend test coverage
- API contract publishing workflow
- deployment runbooks for production
- observability and alerting

## Recommended Next Steps

1. Replace client-readable auth cookies with a backend-managed or HTTP-only session strategy for stronger frontend route protection.
2. Decide whether booking completion will be manual or payment-driven, then implement the missing status transitions.
3. Introduce financial and audit models only after the booking completion path is defined.
4. Add production-facing documentation once deployment targets are confirmed.
