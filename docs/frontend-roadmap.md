# FishBooker Frontend Status and Roadmap

Last reviewed: 2026-04-25

## Current State

The frontend is a Next.js 16 application with one main customer-facing page.

Implemented:

- homepage shell with live slot fetch from the API
- interactive pond map
- slot detail panel
- login dialog backed by the Laravel API
- signed HTTP-only auth cookies with same-origin BFF route handlers
- booking confirmation modal that creates a 15-minute hold
- admin slot management route for create, edit, and delete actions
- authenticated booking history route
- payment page and payment initiation flow
- admin booking operations route for pending-hold cancellation
- admin analytics dashboard

Still thin:

- richer admin drill-down filters on payment and customer access history

## Current File Map

- `app/page.tsx`: fetches slots and renders the landing page
- `components/AuthHeader.tsx`: login state and dialog
- `components/InteractivePondSection.tsx`: selection state
- `components/PondMap.tsx`: clickable slot map
- `components/SlotCard.tsx`: booking CTA and hold feedback
- `lib/api.ts`: typed fetch wrapper and API methods
- `lib/auth-session.ts`: same-origin session helpers
- `app/api/**/*`: protected backend proxy routes
- `features/payments/components/PaymentPageClient.tsx`
- `features/admin-dashboard/components/AdminDashboardPageClient.tsx`
- `features/admin-bookings/components/AdminBookingsPageClient.tsx`

## Delivery Status

### Phase F0: UX baseline

Status: partial

What exists:

- visual direction for the landing page
- interactive booking map
- shared UI primitives from shadcn/Radix
- `docs/DESIGN.md`
- `docs/design-intent.json`

What is still missing:

- page flow map
- reusable tokens for customer and admin surfaces

### Phase F1: customer booking surface

Status: done for MVP+

Completed:

- slot list integration
- live availability rendering
- login dialog
- booking modal and refresh flow
- booking history route for authenticated users

### Phase F2: admin surface

Status: done for current scope

Completed:

- `/admin/slots` route
- `/admin/dashboard` route
- `/admin/bookings` route
- frontend gate for admin session via signed HTTP-only cookies
- create, edit, and delete actions wired to backend admin API
- responsive admin inventory view for mobile and desktop
- dashboard analytics cards backed by reporting data
- CSV export entry point
- cash payment confirmation queue
- pending booking cancellation flow
- payment-status and customer-access filters on admin bookings
- inline customer block and restore actions from the admin booking console

### Phase F3: payments and post-booking flow

Status: done for Midtrans sandbox plus manual cash provider

Completed:

- payment initiation from pending booking
- Midtrans sandbox checkout handoff
- payment detail page
- provider-aware pending payment actions
- cash payment path for admin confirmation
- booking settlement into `SUCCESS`

### Phase F4: production hardening

Status: partial

Delivered:

- app router loading shells
- root error recovery screen
- not-found recovery screen
- frontend unit test runner baseline
- frontend helper coverage for auth, bookings, payments, admin dashboard, and admin controls
- structured observability hooks across the main frontend BFF route families
- deployment notes

Still missing:

- platform-specific observability export

## Recommended Next Frontend Work

1. Add richer component and interaction tests around route actions and refresh loops.
2. Add richer payment receipt and customer summary surfaces after settlement.
3. Add richer booking and customer drill-down history views around the admin operations console.
4. Introduce production-specific error boundaries and observability hooks.
