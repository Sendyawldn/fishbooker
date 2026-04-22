# FishBooker Delivery Roadmap

Last reviewed: 2026-04-22

## Current Delivery Summary

FishBooker has completed the MVP foundation for:

- slot inventory and public availability
- token-based backend auth plus HTTP-only frontend session trust
- admin slot CRUD at the API level
- admin slot control in the frontend
- booking history API and frontend route
- booking holds with 15-minute expiry logic
- payment creation and manual webhook settlement
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

Status: done for manual sandbox provider

Delivered:

- payment creation per pending booking
- manual webhook handling
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
- richer booking operations console

### Stage 5: Hardening and Release Readiness

Status: not started

Missing:

- frontend test coverage
- API contract publishing workflow
- deployment runbooks for production
- observability and alerting

## Recommended Next Steps

1. Replace the manual payment provider with a production gateway adapter.
2. Add observability and alerting around webhook failures and stuck payments.
3. Expand admin tools from analytics into operational booking management.
4. Add production-facing deployment documentation once targets are confirmed.
