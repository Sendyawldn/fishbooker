# FishBooker Frontend Status and Roadmap

Last reviewed: 2026-04-21

## Current State

The frontend is a Next.js 16 application with one main customer-facing page.

Implemented:

- homepage shell with live slot fetch from the API
- interactive pond map
- slot detail panel
- login dialog backed by the Laravel API
- session persistence in `sessionStorage` and cookie-backed route gating
- booking confirmation modal that creates a 15-minute hold
- admin slot management route for create, edit, and delete actions
- authenticated booking history route

Not implemented:

- payment UI
- analytics views

## Current File Map

- `app/page.tsx`: fetches slots and renders the landing page
- `components/AuthHeader.tsx`: login state and dialog
- `components/InteractivePondSection.tsx`: selection state
- `components/PondMap.tsx`: clickable slot map
- `components/SlotCard.tsx`: booking CTA and hold feedback
- `lib/api.ts`: typed fetch wrapper and API methods
- `lib/auth-session.ts`: browser session helpers

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

Status: partial

Completed:

- `/admin/slots` route
- frontend gate for admin session
- create, edit, and delete actions wired to backend admin API
- responsive admin inventory view for mobile and desktop

Still missing:

- dashboard analytics cards backed by real reporting data
- booking management table
- stronger route protection using HTTP-only or backend-managed sessions instead of client-readable cookies

### Phase F3: payments and post-booking flow

Status: not started

Missing:

- payment initiation UI
- payment result page
- receipt or booking summary page

### Phase F4: production hardening

Status: not started

Missing:

- route guards
- loading and error boundaries
- frontend tests
- deployment notes

## Recommended Next Frontend Work

1. Build an admin route that lists slots and updates status or price through the existing admin API.
2. Upgrade route protection from client-readable cookies to a backend-managed session or HTTP-only token flow.
3. Add an active hold countdown or booking detail drill-down for customers.
4. Add tests around `lib/api.ts`, auth session helpers, and key booking interactions.
