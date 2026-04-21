# FishBooker API Guide

Last reviewed: 2026-04-21

## Scope

This document describes the API surface that is implemented in this repository today.
It does not describe planned payment, reporting, webhook, or notification flows that do not exist in code yet.

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

The API uses Laravel Sanctum personal access tokens.

Login flow:

1. `POST /api/v1/auth/login`
2. Read `access_token` from the response
3. Send `Authorization: Bearer <token>` on protected requests

Protected endpoints:

- `GET /api/v1/bookings/me`
- `POST /api/v1/bookings`
- `POST /api/v1/admin/slots`
- `PATCH /api/v1/admin/slots/{slot}`
- `DELETE /api/v1/admin/slots/{slot}`

Admin endpoints also require the authenticated user role to be `ADMIN`.

## Implemented Endpoints

### Authentication

- `POST /api/v1/auth/login`
- `POST /api/auth/login`

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

### Public slot listing

- `GET /api/v1/slots`
- `GET /api/slots`

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
      "price": 50000,
      "created_at": "2026-04-21T12:00:00.000000Z",
      "updated_at": "2026-04-21T12:00:00.000000Z"
    }
  ]
}
```

### Booking creation with 15-minute hold

- `POST /api/v1/bookings`
- `POST /api/bookings`

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
  "valid_until": "2026-04-21T12:15:00.000000Z",
  "data": {
    "id": 10,
    "user_id": 2,
    "slot_id": 1,
    "booking_time": "2026-04-21T12:00:00.000000Z",
    "expires_at": "2026-04-21T12:15:00.000000Z",
    "status": "PENDING",
    "created_at": "2026-04-21T12:00:00.000000Z",
    "updated_at": "2026-04-21T12:00:00.000000Z"
  }
}
```

Important booking behaviors:

- If another user still holds the slot, the API returns `422` with `error: SLOT_LOCKED`.
- If the same user already holds the slot, the API returns `200` and reuses the active hold.
- If an older pending booking for the slot is expired, the API cancels it and allows a new booking.
- When a booking hold is created, the slot status changes from `TERSEDIA` to `DIBOOKING`.

### Booking history for the authenticated user

- `GET /api/v1/bookings/me`
- `GET /api/bookings/me`

Required headers:

```http
Authorization: Bearer <token>
```

Response shape:

```json
{
  "success": true,
  "message": "Riwayat booking berhasil diambil.",
  "data": [
    {
      "id": 10,
      "user_id": 2,
      "slot_id": 1,
      "booking_time": "2026-04-21T12:00:00.000000Z",
      "expires_at": "2026-04-21T12:15:00.000000Z",
      "status": "PENDING",
      "slot": {
        "id": 1,
        "slot_number": 1,
        "status": "DIBOOKING",
        "price": 50000,
        "created_at": "2026-04-21T11:00:00.000000Z",
        "updated_at": "2026-04-21T12:00:00.000000Z"
      }
    }
  ]
}
```

Booking history behavior:

- Response only contains bookings that belong to the authenticated user.
- Expired `PENDING` bookings for the current user are normalized to `CANCELLED` when history is requested.
- If an expired hold was the last active hold for a slot, the slot status is released back to `TERSEDIA`.

### Admin slot management

- `POST /api/v1/admin/slots`
- `PATCH /api/v1/admin/slots/{slot}`
- `DELETE /api/v1/admin/slots/{slot}`
- Compatibility aliases also exist under `/api/admin/...`

Create request:

```json
{
  "slot_number": 11,
  "price": 55000,
  "status": "TERSEDIA"
}
```

Update request:

```json
{
  "price": 75000,
  "status": "PERBAIKAN"
}
```

Valid slot statuses:

- `TERSEDIA`
- `DIBOOKING`
- `PERBAIKAN`

## Error Semantics

Common error responses in the current implementation:

- `401 Unauthorized`
  - Invalid email or password on login
  - Missing or invalid bearer token on protected endpoints
- `403 Forbidden`
  - Authenticated user is not an admin for admin routes
- `422 Unprocessable Entity`
  - Validation error
  - Slot is locked by another booking hold
  - Slot is not available

Booking hold conflict example:

```json
{
  "error": "SLOT_LOCKED",
  "message": "Lapak sedang dalam proses pembayaran oleh user lain.",
  "locked_until": "2026-04-21T12:15:00.000000Z"
}
```

## Out of Scope Today

The following items are mentioned in older documents but are not implemented in this codebase yet:

- Midtrans or any payment gateway integration
- Payment webhooks
- Financial journals and revenue reporting
- Booking verification commands
- Admin analytics dashboard API
- Custom maintenance CLI commands for bookings or slots

## Related References

- `docs/openapi.yaml`
- `docs/architecture.md`
- `docs/data-model.md`
- `backend/tests/Feature/Api/BookingFlowTest.php`
- `backend/tests/Feature/Api/AdminSlotManagementTest.php`
