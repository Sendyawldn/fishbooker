# 🎣 FISHBOOKER

**FISHBOOKER** adalah platform manajemen operasional dan reservasi pemancingan terpadu yang dirancang untuk menghilangkan risiko double booking dan memberikan pengalaman pengguna yang modern.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

## 📌 Tentang Proyek

FISHBOOKER adalah solusi lengkap untuk mengelola operasional kolam pemancingan dengan fitur-fitur unggulan:

### ✨ Fitur Utama

- **Real-time Slot Locking** - Mencegah double booking dengan sinkronisasi real-time
- **Manajemen Reservasi** - Sistem booking yang mudah dan intuitif
- **Laporan Keuangan Otomatis** - Transparansi keuangan untuk pemilik kolam
- **Dashboard Admin** - Monitoring operasional yang komprehensif
- **Integrasi Peta Interaktif** - Visualisasi lokasi lapak pemancingan
- **Manajemen Pengguna** - Sistem autentikasi dan otorisasi yang aman

## 🏗️ Arsitektur Proyek

Proyek ini menggunakan arsitektur **monorepo** dengan dua bagian utama:

````
fishbooker/
# FISHBOOKER

FishBooker adalah aplikasi reservasi lapak pemancingan dengan fokus pada pencegahan double booking melalui mekanisme lock slot dan hold expiry.

## Ringkasan

Project ini berjalan sebagai monorepo dengan tiga area utama:

- backend: API Laravel untuk auth, slot management, dan booking flow
- frontend: UI Next.js untuk denah interaktif dan alur booking
- docs: dokumentasi teknis, arsitektur, API, roadmap

## Struktur Repository

```text
fishbooker/
|- backend/
|- frontend/
|- docs/
|- README.md
````

## Tech Stack

Backend:

- PHP 8.3+
- Laravel 13
- Laravel Sanctum
- MySQL (via Laravel Sail)
- Redis (via Laravel Sail)

Frontend:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## Fitur yang Sudah Tersedia

- Login API berbasis Sanctum token
- Public slot discovery
- Admin slot CRUD (create, update, delete)
- Booking flow dengan lock proses dan hold 15 menit
- Penolakan booking bila slot masih di-hold user lain
- Denah lapak interaktif di frontend

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Sendyawldn/fishbooker.git
cd fishbooker
```

### 2. Setup Backend

```bash
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate:fresh --seed
```

Backend API default di:

```text
http://localhost:8000
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend default di:

```text
http://localhost:3000
```

## Environment Variables

Frontend membaca variabel ini:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_EMAIL=test@example.com
NEXT_PUBLIC_DEMO_PASSWORD=password
```

Catatan:

- Jika NEXT_PUBLIC_API_BASE_URL tidak diisi, frontend akan fallback ke http://localhost:8000.
- Endpoint yang dipanggil frontend saat ini menggunakan prefix /api/v1.

## Endpoint Penting

Auth:

- POST /api/v1/auth/login

Slot:

- GET /api/v1/slots
- POST /api/v1/admin/slots (admin)
- PATCH /api/v1/admin/slots/{slot_id} (admin)
- DELETE /api/v1/admin/slots/{slot_id} (admin)

Booking:

- POST /api/v1/bookings (auth required)

Detail contract response ada di dokumentasi API.

## Menjalankan Test

Backend:

```bash
cd backend
./vendor/bin/sail artisan test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## Dokumentasi

Dokumen utama ada di folder docs:

- docs/api.md
- docs/architecture.md
- docs/data-model.md
- docs/local-dev-setup.md
- docs/roadmap.md
- docs/frontend-roadmap.md
- docs/runbook.md

## Catatan Scope Repository

Repository ini saat ini disederhanakan agar hanya melacak:

- backend
- frontend
- docs
- README.md

## Owner

- Sendyawldn
