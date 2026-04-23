# FishBooker Frontend Status and Roadmap

Last reviewed: 2026-04-23

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
- admin analytics dashboard

Still thin:

- frontend test coverage
- broader booking operations beyond payment continuation
- richer admin drill-down filters

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
- frontend gate for admin session via signed HTTP-only cookies
- create, edit, and delete actions wired to backend admin API
- responsive admin inventory view for mobile and desktop
- dashboard analytics cards backed by reporting data
- CSV export entry point
- cash payment confirmation queue

### Phase F3: payments and post-booking flow

Status: done for sandbox/manual provider

Completed:

- payment initiation from pending booking
- payment detail page
- transfer webhook simulation flow
- cash payment path for admin confirmation
- booking settlement into `SUCCESS`

### Phase F4: production hardening

Status: partial

Delivered:

- app router loading shells
- root error recovery screen
- not-found recovery screen
- frontend unit test runner baseline
- deployment notes

Still missing:

- richer component and integration coverage
- platform-specific observability export

## Recommended Next Frontend Work

1. Add frontend tests around BFF auth helpers, payment page state changes, and admin dashboard actions.
2. Add richer payment receipt and customer summary surfaces after settlement.
3. Expand admin booking management beyond slot inventory and cash confirmation.
4. Introduce production-specific error boundaries and observability hooks.
