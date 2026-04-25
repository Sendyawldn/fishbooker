# FishBooker API Guide

Last reviewed: 2026-04-25

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

- `MIDTRANS_SNAP`
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
    "provider": "MIDTRANS",
    "method": "MIDTRANS_SNAP",
    "status": "PENDING",
    "amount": 50000,
    "currency": "IDR",
    "checkout_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/example",
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

### Midtrans webhook

`POST /api/v1/payments/webhooks/midtrans`

Payload summary:

```json
{
  "order_id": "2db6d5f0-c508-4ff7-8f55-90b0f2719dd0",
  "status_code": "200",
  "gross_amount": "50000.00",
  "transaction_status": "settlement",
  "transaction_id": "midtrans-demo-transaction-id",
  "payment_type": "bank_transfer",
  "signature_key": "<sha512>"
}
```

Behavior:

- Verifies the official Midtrans notification signature before processing.
- Stores webhook events idempotently by `provider + event_id`.
- Maps Midtrans status values into FishBooker payment states.
- Marks the booking `SUCCESS` and writes finance journals on settlement.
- Cancels and releases the booking when Midtrans reports expiry, cancel, or failure-like statuses.

### Admin dashboard and reporting

`GET /api/v1/admin/dashboard`

Returns:

- slot occupancy metrics
- revenue today and this month
- active holds and pending payments
- operational health summary for stale pending payments and expired pending bookings
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

### Admin booking operations

`GET /api/v1/admin/bookings`

Optional query params:

- `status=ALL|PENDING|SUCCESS|CANCELLED`
- `payment_status=ALL|NONE|PENDING|PAID|FAILED|EXPIRED|CANCELLED`
- `customer_access=ALL|ACTIVE|BLOCKED`
- `search=<customer name, email, or slot number>`
- `per_page=<1..50>`

Returns paginated admin booking data with customer, slot, and latest payment context.

Each booking row now includes customer booking-access state:

- `user.is_booking_blocked`
- `user.booking_block_reason`

`POST /api/v1/admin/bookings/{booking}/cancel`

Request body:

```json
{
  "note": "Hold dibatalkan admin."
}
```

Behavior:

- Only admins may call this endpoint.
- Only `PENDING` bookings may be cancelled.
- If the latest payment is a pending Midtrans payment, FishBooker first asks Midtrans to expire the transaction.
- The booking is then marked `CANCELLED`, the slot is released, and the pending payment attempt is closed locally.

### Admin booking controls

`GET /api/v1/admin/operations/booking-controls`

Returns the current operational booking controls:

- `bookings_enabled`
- `max_active_holds_per_user`

`PATCH /api/v1/admin/operations/booking-controls`

Request body:

```json
{
  "bookings_enabled": false,
  "max_active_holds_per_user": 1
}
```

Behavior:

- Only admins may call this endpoint.
- `bookings_enabled=false` acts as a kill switch for new booking creation.
- `max_active_holds_per_user` limits the number of active pending holds a single customer may own.

`GET /api/v1/admin/customers`

Optional query params:

- `search=<customer name or email>`
- `per_page=<1..50>`

Returns paginated customer booking-control data with:

- block status
- block reason
- active pending booking count
- successful booking count
- cancelled booking count

`PATCH /api/v1/admin/customers/{user}/booking-access`

Request body:

```json
{
  "is_booking_blocked": true,
  "booking_block_reason": "Sering booking tanpa pembayaran."
}
```

Behavior:

- Only admins may call this endpoint.
- Only customer accounts may be blocked or restored.
- A blocked customer cannot create new bookings until the admin restores access.

## Error Semantics

Common error responses in the current implementation:

- `401 Unauthorized`
  - Invalid email or password on login
  - Missing or invalid bearer token on protected endpoints
  - Invalid manual or Midtrans webhook signature
- `403 Forbidden`
  - Authenticated user is not an admin for admin routes
  - A payment or booking does not belong to the authenticated user
  - Customer account is blocked from creating new bookings
- `422 Unprocessable Entity`
  - Validation error
  - Slot is locked by another booking hold
  - Booking hold is expired before payment creation
  - Admin attempts to confirm a non-cash payment
  - Admin attempts to cancel a non-pending booking
  - Customer exceeds the active hold limit
- `503 Service Unavailable`
  - Booking kill switch is active and new bookings are temporarily disabled

## Current Provider Scope

The repository now ships a Midtrans sandbox provider for redirect checkout plus the existing manual provider for cash confirmation and local fallback flows.
The payment lifecycle remains adapter-friendly, so a different production provider can still be introduced later behind the same booking and settlement contracts.

## Related References

- `docs/openapi.yaml`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/runbook.md`
