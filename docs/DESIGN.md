# FishBooker Frontend Design

Last reviewed: 2026-04-21

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

- Auth state is stored in `sessionStorage`
- A client-readable cookie mirrors session state for request-time route gating
- `proxy.ts` and server route checks gate admin and booking pages for UX, while the backend remains the final authorization layer
- Analytics and booking administration views do not exist yet

## Next Design Tasks

1. Define page flows for admin operations and booking history.
2. Promote repeated colors, spacing, and status tokens into a clearer shared token map.
3. Add empty, loading, and error states for more frontend routes as they are introduced.
