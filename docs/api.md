# FishBooker API Guide

Last reviewed: 2026-04-22

## Scope

This document describes the API surface that is implemented in this repository today, including the payment sandbox, payment webhooks, admin reporting, and auth support endpoints that now exist in code.

## Source of Truth

- Human-readable summary: `docs/api.md`
- Machine-readable contract: `docs/openapi.yaml`
- Runtime implementation: `backend/routes/api.php`

If the routes or payloads change, update `docs/openapi.yaml` in the same change.

## Base URLs

- Backend app: `http://localhost:8000`
- Versioned API base: `http://localhost:8000/api/v1`
- Compatibility API base: `http://localhost:8000/api`

Both route groups exist today. New frontend work should prefer the versioned `/api/v1` paths.

## Authentication Model

The backend API uses Laravel Sanctum personal access tokens.
The Next.js frontend now stores the access token in an HTTP-only cookie and proxies protected calls through same-origin route handlers, but the Laravel API itself still expects bearer tokens.

Primary auth endpoints:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

Protected customer endpoints:

- `GET /api/v1/bookings/me`
- `POST /api/v1/bookings`
- `POST /api/v1/bookings/{booking}/payments`
- `GET /api/v1/payments/{reference}`

Protected admin endpoints:

- `POST /api/v1/admin/slots`
- `PATCH /api/v1/admin/slots/{slot}`
- `DELETE /api/v1/admin/slots/{slot}`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/reports/finance/export`
- `POST /api/v1/admin/payments/{payment}/confirm-cash`

Public webhook endpoint:

- `POST /api/v1/payments/webhooks/manual`

## Implemented Endpoints

### Authentication

`POST /api/v1/auth/login`

Request body:

```json
{
  "email": "test@example.com",
  "password": "password"
}
```

Success response:

```json
{
  "access_token": "1|token-value",
  "token_type": "Bearer",
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "test@example.com",
    "role": "PELANGGAN"
  }
}
```

`GET /api/v1/auth/me`

Returns the authenticated user summary for the current bearer token.

`POST /api/v1/auth/logout`

Revokes the current Sanctum token.

### Public slot listing

`GET /api/v1/slots`

Response shape:

```json
{
  "success": true,
  "message": "Daftar lapak berhasil diambil",
  "data": [
    {
      "id": 1,
      "slot_number": 1,
      "status": "TERSEDIA",
      "price": 50000
    }
  ]
}
```

### Booking creation with 15-minute hold

`POST /api/v1/bookings`

Required headers:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "slot_id": 1
}
```

Success response:

```json
{
  "success": true,
  "message": "Booking berhasil dibuat. Lapak terkunci selama 15 menit.",
  "valid_until": "2026-04-22T12:15:00.000000Z",
  "data": {
    "id": 10,
    "user_id": 2,
    "slot_id": 1,
    "booking_time": "2026-04-22T12:00:00.000000Z",
    "expires_at": "2026-04-22T12:15:00.000000Z",
    "status": "PENDING"
  }
}
```

Important booking behaviors:

- If another user still holds the slot, the API returns `422` with `error: SLOT_LOCKED`.
- If the same user already holds the slot, the API returns `200` and reuses the active hold.
- If an older pending booking for the slot is expired, the API cancels it and allows a new booking.
- When a booking hold is created, the slot status changes from `TERSEDIA` to `DIBOOKING`.

### Booking history

`GET /api/v1/bookings/me`

Returns bookings owned by the authenticated user, including slot data and normalized expired holds.

### Payment creation for an existing booking

`POST /api/v1/bookings/{booking}/payments`

Request body:

```json
{
  "method": "MANUAL_TRANSFER"
}
```

Supported methods:

- `MANUAL_TRANSFER`
- `CASH`

Behavior:

- Reuses an existing `PENDING` payment for the same booking if it already exists.
- Rejects expired booking holds.
- Rejects bookings that are already `SUCCESS`.
- Returns a payment reference used by the frontend payment page.

Example response:

```json
{
  "success": true,
  "message": "Instruksi pembayaran berhasil disiapkan.",
  "data": {
    "reference": "2db6d5f0-c508-4ff7-8f55-90b0f2719dd0",
    "provider": "MANUAL",
    "method": "MANUAL_TRANSFER",
    "status": "PENDING",
    "amount": 50000,
    "currency": "IDR",
    "checkout_url": "http://localhost:3000/payments/2db6d5f0-c508-4ff7-8f55-90b0f2719dd0",
    "expires_at": "2026-04-22T12:15:00.000000Z",
    "paid_at": null
  }
}
```

### Payment detail lookup

`GET /api/v1/payments/{reference}`

Returns the current payment state plus booking and slot details for the booking owner or an admin.

### Manual webhook

`POST /api/v1/payments/webhooks/manual`

Required headers:

```http
X-Fishbooker-Event-Id: evt-123
X-Fishbooker-Signature: <sha256-hmac>
Content-Type: application/json
```

Payload:

```json
{
  "payment_reference": "2db6d5f0-c508-4ff7-8f55-90b0f2719dd0",
  "status": "PAID",
  "event_type": "payment.settled",
  "event_time": "2026-04-22T12:05:00.000000Z"
}
```

Behavior:

- Verifies the HMAC signature before processing.
- Stores webhook events idempotently by `provider + event_id`.
- Marks the payment as `PAID`, `FAILED`, `EXPIRED`, or `CANCELLED`.
- Transitions the booking to `SUCCESS` on `PAID`.
- Writes an immutable `PAYMENT_CAPTURED` journal row on `PAID`.
- Cancels and releases the booking when failure-like statuses arrive.

### Admin dashboard and reporting

`GET /api/v1/admin/dashboard`

Returns:

- slot occupancy metrics
- revenue today and this month
- active holds and pending payments
- recent transaction feed
- pending cash payments that still need confirmation
- 7-day revenue trend

`GET /api/v1/admin/reports/finance/export`

Returns a CSV export of paid transactions.

### Admin cash confirmation

`POST /api/v1/admin/payments/{payment}/confirm-cash`

Request body:

```json
{
  "note": "Pembayaran diterima di kasir."
}
```

Behavior:

- Only admins may call this endpoint.
- Only `CASH` payments in `PENDING` state may be confirmed.
- Internally reuses the same webhook-style settlement flow so booking, payment, and journal state stay consistent.

## Error Semantics

Common error responses in the current implementation:

- `401 Unauthorized`
  - Invalid email or password on login
  - Missing or invalid bearer token on protected endpoints
  - Invalid webhook signature
- `403 Forbidden`
  - Authenticated user is not an admin for admin routes
  - A payment or booking does not belong to the authenticated user
- `422 Unprocessable Entity`
  - Validation error
  - Slot is locked by another booking hold
  - Booking hold is expired before payment creation
  - Admin attempts to confirm a non-cash payment

## Current Provider Scope

The repository now ships a local manual payment provider and webhook contract.
This is intentionally adapter-friendly, so a real provider such as Midtrans or Xendit can replace the manual provider later without redesigning the booking lifecycle.

## Related References

- `docs/openapi.yaml`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/runbook.md`
