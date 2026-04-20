# Project FISHBOOKER - Frontend Roadmap

## 1. Keputusan Stack

Pilihan final untuk fase pengembangan utama:

- **Framework UI**: React (Next.js 15 - App Router)
- **Build Tool**: Next.js Bundler (SWC)
- **Styling**: Tailwind CSS + Shadcn UI (Design System)
- **State & Server Data**: Next.js Server Components + Fetch API
- **Iconography**: Lucide React

**Alasan Pemilihan Stack:**

- **Next.js 15**: Fitur `router.refresh()` memungkinkan sinkronisasi status lapak tanpa reload halaman penuh.
- **Shadcn UI**: Mempercepat pembuatan dashboard admin yang konsisten dan aksesibel.
- **Boundary**: Pemisahan frontend dan backend sejak awal memberikan Boundary yang jelas untuk siklus rilis yang independen.

## 2. Keputusan Deployment

- **Frontend**: Vercel (Edge Delivery untuk performa responsif).
- **Backend API**: Cloud Run / VPS (Laravel Sail).
- **CORS & Auth**: Tervalidasi menggunakan Laravel Sanctum.

## 3. Arsitektur Frontend

- **App Shell**: Layout terintegrasi dengan Sidebar (Admin) dan Navbar (Customer).
- **Session Guard**: Proteksi rute berbasis role (Admin vs Customer).
- **Real-time Sync**: Pemanfaatan revalidasi data server saat terjadi transaksi sukses.

## 4. Roadmap Frontend per Fase

### F-0: UX Blueprint and Design System

Tujuan: Mendefinisikan bahasa visual dan alur informasi.

- [ ] Arsitektur Informasi (Mapping alur booking).
- [ ] Wireframe denah kolam interaktif (SVG/Grid).
- [ ] Integrasi Design Token (Emerald for success, Rose for occupied).
- **DoD**: Disetujui untuk implementasi sprint.

### F-1: Frontend Scaffold

Tujuan: Setup base project dan layout utama.

- [ ] Next.js 15 project bootstrap.
- [ ] Layout utama (Responsive Navbar & Footer).
- [ ] Auth guard placeholder (Login/Register page).
- **DoD**: Halaman utama dapat berjalan di localhost.

### F-2: Core Booking Views

Tujuan: Visualisasi ketersediaan lapak secara interaktif.

- [x] Map View: Denah kolam dengan status dinamis.
- [x] Slot Card: Komponen detail lapak dan harga.
- [x] Booking Modal: Alur konfirmasi pesanan yang seamless.
- **DoD**: Data dari API Laravel dapat divisualisasikan dengan benar.

### F-3: Admin & Analytics Dashboard

Tujuan: Interface manajemen untuk owner kolam.

- [ ] Dashboard Overview (Statistik Pendapatan).
- [ ] Management Table (Daftar Booking & Status Pembayaran).
- [ ] Slot Controller (Toggle Maintenance & Edit Harga).
- **DoD**: Admin dapat mengelola operasional kolam dari UI.

### F-4: Payment & Notification Integration

Tujuan: Alur pembayaran dan invoice yang transparan.

- [ ] Midtrans Snap Integration (Popup/Redirect).
- [ ] Payment Result Page (Success/Failed handling).
- [ ] Digital Receipt View (Detail pesanan user).
- **DoD**: Flow pembayaran dari klik 'Pesan' sampai 'Sukses' tervalidasi.

### F-5: Production Hardening

Tujuan: Optimasi akhir dan stabilitas.

- [ ] Error Boundary & Loading Skeletons.
- [ ] PWA Support (Installable di smartphone pemancing).
- [ ] Performance Audit (Lighthouse score > 90).
- **DoD**: Siap digunakan untuk operasional harian (Production Ready).

## 5. Urutan Eksekusi yang Disarankan

1. Selesaikan **F-0** dan **F-1** (Sudah dimulai dengan setup Next.js).
2. Fokus pada **F-2** (Interactive Map) untuk menyelesaikan Core Engine.
3. Masuk ke **F-3** (Admin View) bersamaan dengan implementasi Auth di Backend.
4. Aktifkan **F-4** jika integrasi Midtrans sudah siap.
5. Tutup dengan **F-5** sebelum sidang atau rilis publik.

---
