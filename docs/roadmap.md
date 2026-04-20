# Project FISHBOOKER - Roadmap & Execution Path

## Prinsip Eksekusi

- **Linear Phase**: Fase berikutnya hanya dimulai jika fase saat ini sudah memenuhi _Definition of Done_ (DoD).
- **Audit Ready**: Setiap fitur yang berkaitan dengan uang wajib memiliki jejak audit (_Reason Code_).
- **Safety First**: Prioritaskan keamanan transaksi (locking) di atas estetika UI.

## Fase 0 - Foundation & Blueprint (Done)

Tujuan: Meletakkan pondasi arsitektur dan kontrak data.

- [x] Architecture Blueprint & High-Level Flow.
- [x] Data Model Draft (MySQL Schema).
- [x] API Contract Specification.
- [x] Repository Bootstrap (Laravel Sail + Next.js).

**Definition of Done:**

- Seluruh dokumen `docs/` tersedia dan sinkron dengan struktur folder.

## Fase 1 - Core Booking Engine (Done)

Tujuan: Pipeline reservasi end-to-end tanpa integrasi eksternal.

- [x] CRUD Management untuk Slot (Admin).
- [x] Atomic Transactional Booking (Backend).
- [x] Interactive Denah Kolam (Frontend).
- [x] Integrasi Redis untuk temporary slot locking (15 menit).

**Definition of Done:**

- User bisa pilih lapak, slot terkunci, dan data masuk ke DB tanpa duplikasi.
- Unit Test untuk `BookingController` statusnya hijau (Pass).

## Fase 2 - Auth & Role Governance

Tujuan: Mengamankan akses dan memisahkan otoritas.

- [ ] Implementasi Laravel Sanctum.
- [ ] Role Separation: `CUSTOMER` vs `ADMIN`.
- [ ] Protected Routes di Next.js (Auth Middleware).
- [ ] User Profile dynamic integration di Header.

**Definition of Done:**

- User tanpa token tidak bisa melakukan booking.
- Admin bisa mengakses dashboard stats yang tertutup untuk customer.

## Fase 3 - Payment Gateway Integration

Tujuan: Automasi verifikasi pembayaran.

- [ ] Integrasi Midtrans Snap API.
- [ ] Webhook Handler untuk `settlement`, `expire`, dan `cancel`.
- [ ] Sinkronisasi otomatis status lapak dari `booked` ke `paid`.

**Definition of Done:**

- Transaksi di Sandbox Midtrans berhasil mengubah status di database FishBooker secara real-time.

## Fase 4 - Operational Intelligence

Tujuan: Manajemen finansial dan audit untuk owner.

- [ ] Financial Journaling otomatis.
- [ ] Daily Revenue Report & Occupancy Analytics.
- [ ] Export Data (CSV/PDF) untuk pembukuan.
- [ ] WhatsApp Notification Trigger (Status: Paid).

**Definition of Done:**

- Laporan bulanan dapat dihasilkan dan sesuai dengan total transaksi di database.

## Fase 5 - Production Hardening

Tujuan: Deployment dan stabilitas.

- [ ] Deployment Cloud Run (Backend) & Vercel (Frontend).
- [ ] PWA (Progressive Web App) Support agar bisa diinstall di HP.
- [ ] Load Testing untuk simulasi 100+ user booking bersamaan.

**Definition of Done:**

- Sistem berjalan stabil di URL produksi dengan SSL aktif.

---
