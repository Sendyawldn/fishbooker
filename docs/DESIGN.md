# FishBooker Frontend Design

Last reviewed: 2026-04-22

## Purpose

This document captures the current design language of the frontend so future UI work can stay consistent.
It reflects the UI that exists in the repository today, not a speculative redesign.

## Product Surface

The current frontend is a single-page customer experience for:

- viewing slot availability
- logging in with an API account
- selecting a slot from a pond map
- creating a booking hold
- managing slots from an admin control page
- reviewing the authenticated user's booking history
- reviewing and finishing payment from a dedicated payment page
- monitoring metrics from an admin analytics dashboard

## Design Direction

The UI uses a calm aquatic look with strong contrast between system states:

- neutral slate panels for structure
- emerald for available and successful states
- rose for held or unavailable warning states
- cyan and sky accents for the pond map surface

## Core Components

### Header

- sticky top navigation
- brand lockup and location hint
- login dialog or active session summary

### Hero

- large headline
- availability summary cards
- dark panel with soft color glow

### Pond map

- clickable slot tiles
- visible slot state through color and label
- selected slot emphasis with a ring state

### Slot detail card

- slot number and status
- price summary
- booking call to action
- booking confirmation dialog

### Admin control board

- operational hero with fast admin actions
- responsive slot inventory cards and dense desktop table
- create and edit slot dialog
- destructive delete action with confirmation

### Booking history board

- authenticated route for customer history
- clear booking state badges
- slot and hold metadata grouped into scan-friendly cards
- refresh action for quick state sync after booking

### Payment board

- dedicated route for a payment reference
- clear payment state badge
- actions for transfer sandbox simulation or cash waiting state

### Admin analytics board

- revenue and occupancy summary cards
- recent transaction feed
- pending cash confirmation queue
- quick export action

## Interaction Rules

- Users should understand slot status before opening the booking dialog.
- Booking must require login and provide direct feedback when the slot is held by someone else.
- Success and error states should be shown inline inside the booking dialog.
- Frontend refresh after booking should be fast and obvious.

## State Language

Current labels and state mapping:

- `TERSEDIA`: available, emerald styling
- `DIBOOKING`: active hold, rose styling
- `PERBAIKAN`: maintenance, muted styling

## Current Constraints

- Auth trust now lives in signed HTTP-only cookies managed by Next.js route handlers
- `proxy.ts` and server route checks gate admin, booking, and payment pages for UX, while Laravel Sanctum remains the final authorization layer
- The current payment provider is a manual sandbox, not a production gateway

## Next Design Tasks

1. Promote repeated colors, spacing, and status tokens into a clearer shared token map.
2. Add richer receipt states and post-payment customer summary surfaces.
3. Extend admin analytics into deeper booking and finance drill-down views.
