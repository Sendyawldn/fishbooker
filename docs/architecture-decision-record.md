# Architecture Decision Record (ADR)

## ADR-001: Modular Monolith with Laravel API + Next.js Frontend

- Status: Accepted
- Date: 2026-04-20
- Owner: FishBooker Team

### Context

FishBooker saat ini dikembangkan untuk fase awal (MVP) dengan kebutuhan utama:

- mencegah double booking,
- menyediakan kontrol operasional untuk admin,
- menjaga kecepatan iterasi tim.

Kode berjalan pada dua aplikasi terpisah:

- Backend API: Laravel
- Frontend: Next.js

### Decision

Arsitektur yang dipakai adalah modular monolith per aplikasi:

- Backend tetap satu service API Laravel dengan boundary fitur (slot, booking, auth).
- Frontend tetap satu aplikasi Next.js sebagai consumer API.
- Integrasi antar aplikasi dilakukan lewat HTTP API yang terkontrak.

### Consequences

- Positif:
  - Delivery lebih cepat untuk fase awal.
  - Operasional sederhana untuk tim kecil.
  - Perubahan fitur admin/booking bisa dilakukan tanpa overhead microservices.
- Negatif:
  - Perlu disiplin boundary modul agar tidak menjadi monolith yang rapuh.
  - Skalabilitas horizontal granular per domain belum tersedia.

### Guardrails

- Endpoint API yang berubah wajib diikuti sinkronisasi dokumentasi `docs/api.md` dalam perubahan yang sama.
- Endpoint administratif wajib proteksi `auth:sanctum` + role check.
- Perubahan critical flow booking wajib disertai test regresi.
