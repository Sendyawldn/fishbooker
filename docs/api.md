# FishBooker API Documentation

## Overview

FishBooker mengekspos logika bisnis reservasi, manajemen lapak, dan tata kelola keuangan melalui REST API yang dibangun di atas **Laravel 12**. API ini memungkinkan:

- Sinkronisasi status lapak secara real-time untuk denah interaktif.
- Eksekusi transaksi booking dengan integrasi Payment Gateway (Midtrans).
- Pengambilan data statistik operasional untuk Admin Dashboard.
- Automasi notifikasi status pembayaran via Webhooks.

---

## Source of Truth

Untuk kontrak API terbaru (OpenAPI / Swagger), gunakan endpoint lokal saat server menyala:

- `http://localhost:8000/api/documentation` _(jika menggunakan L5-Swagger)_

Dokumen ini berfungsi sebagai panduan operasional tambahan untuk pengembang Frontend.

---

## Getting Started

### Start the API Server (Docker Sail)

Development mode (Backend):

```bash
cd backend
./vendor/bin/sail up -d
```

Pastikan migrasi dan seeder sudah dijalankan untuk data awal:

```bash
./vendor/bin/sail artisan migrate:fresh --seed
```

API akan tersedia di:

```text
http://localhost:8000/api
```

## API Endpoints

### Authentication (Login)

```http
POST /api/v1/auth/login
```

Compatibility path yang juga tersedia:

```http
POST /api/auth/login
```

Menggunakan Laravel Sanctum. Token yang dihasilkan harus disertakan dalam header:

```http
Authorization: Bearer <token>
```

```json
Request Body
{
"email": "zen@fishbooker.id",
"password": "password-rahasia"
}
```

Response

```json
{
  "access_token": "1|rahasia-jwt-token",
  "token_type": "Bearer",
  "user": {
    "name": "Sendi Awaludin",
    "role": "admin"
  }
}
```

````md id="a1m7s5"
### Admin Slot Management (Update Price / Status)

```http
PATCH /api/v1/admin/slots/{slot_id}
```
````

Requires:

```http
Authorization: Bearer <token>
```

Requires Role: `ADMIN`

Endpoint ini dipakai admin untuk:

- mengubah harga lapak secara dinamis,
- mengubah status lapak (`TERSEDIA`, `DIBOOKING`, `PERBAIKAN`).

Request Body (minimal satu field wajib dikirim):

```json
{
  "price": 75000,
  "status": "PERBAIKAN"
}
```

Response (Success)

```json
{
  "success": true,
  "message": "Lapak berhasil diperbarui",
  "data": {
    "id": 8,
    "slot_number": 8,
    "status": "PERBAIKAN",
    "price": 75000,
    "created_at": "2026-04-20T15:00:00.000000Z",
    "updated_at": "2026-04-20T15:05:00.000000Z"
  }
}
```

Create Slot (Admin):

```http
POST /api/v1/admin/slots
```

Request Body

```json
{
  "slot_number": 12,
  "price": 50000,
  "status": "TERSEDIA"
}
```

Delete Slot (Admin):

```http
DELETE /api/v1/admin/slots/{slot_id}
```

````md id="b5v9c7"
### Slot Discovery (Public)

```http
GET /api/v1/slots
```
````

Mengambil semua status lapak terbaru untuk dirender ke dalam peta denah.

Response

```json
[
  {
    "id": 1,
    "slot_number": "A1",
    "slug": "lapak-a1",
    "price": 50000,
    "status": "TERSEDIA",
    "coordinates": {
      "x": 12.5,
      "y": 45.0
    }
  },
  {
    "id": 2,
    "slot_number": "A2",
    "slug": "lapak-a2",
    "price": 50000,
    "status": "DIBOOKING",
    "coordinates": {
      "x": 12.5,
      "y": 55.0
    }
  }
]
```

````md id="d2r6p8"
### Create Booking Execution

```http
POST /api/v1/bookings
```
````

Requires:

```http
Authorization: Bearer <token>
```

Endpoint ini melakukan atomic transaction: mengunci slot dan membuat order.

Request Body

```json
{
  "slot_id": 1
}
```

Response (Success)

```json
{
  "success": true,
  "message": "Booking berhasil dibuat. Lapak terkunci selama 15 menit.",
  "valid_until": "2026-04-20T17:30:00.000000Z",
  "data": {
    "id": 12,
    "user_id": 5,
    "slot_id": 1,
    "status": "PENDING",
    "booking_time": "2026-04-20T17:15:00.000000Z",
    "expires_at": "2026-04-20T17:30:00.000000Z",
    "created_at": "2026-04-20T17:15:00.000000Z",
    "updated_at": "2026-04-20T17:15:00.000000Z"
  }
}
```

Jika slot masih di-hold user lain, API mengembalikan:

```json
{
  "error": "SLOT_LOCKED",
  "message": "Lapak sedang dalam proses pembayaran oleh user lain.",
  "locked_until": "2026-04-20T17:30:00.000000Z"
}
```

````md id="f9t1w3"
### Admin Governance Summary

```http
GET /api/v1/admin/governance/summary
```
````

Requires Role: admin

Mendapatkan ringkasan status tata kelola reservasi.

Response

```json
{
  "total_revenue": 1250000,
  "occupancy_rate": "75%",
  "pending_payments": 3,
  "active_slots": 15,
  "maintenance_slots": 2
}
```

````md id="h4u7y2"
### Payment Webhook (Midtrans)

```http
POST /api/v1/webhooks/payment/midtrans
```
````

Endpoint asinkron yang menerima notifikasi dari Midtrans untuk update status database secara otomatis.

Payload Example

```json
{
  "order_id": "fb-uuid-2026",
  "transaction_status": "settlement",
  "payment_type": "qris",
  "gross_amount": "50000.00"
}
```

````md id="j6m2q9"
## Error Handling

Semua endpoint mengembalikan kode status HTTP yang sesuai:

- `200 OK` → Operasi berhasil
- `401 Unauthorized` → Token hilang atau tidak valid
- `403 Forbidden` → User tidak memiliki role admin
- `422 Unprocessable Entity` → Slot sudah dikunci / dibooking orang lain

#### Contoh Error Response (Slot Conflict)

```json
{
  "error": "SLOT_LOCKED",
  "message": "Lapak A1 sedang dalam proses pembayaran oleh user lain.",
  "locked_until": "2026-04-17T13:45:00Z"
}
```
````

````md id="k8n5r4"
## Integration with Notification System

Backend terintegrasi dengan WhatsApp Gateway (Fonnte / Wootalk) yang dipicu setelah status pembayaran `Paid`.

```bash
# Trigger manual pengecekan pembayaran expired via scheduler.
./vendor/bin/sail artisan schedule:run
```
````

````md id="p1z7x6"
## Data Directories Structure

Backend mengharapkan struktur direktori berikut untuk penyimpanan laporan:

```text
backend/
├── storage/
│   ├── app/
│   │   ├── reports/     # Laporan Keuangan PDF
│   │   ├── invoices/    # Bukti Booking Pelanggan
│   │   └── logs/        # Audit Trail API
```
````
