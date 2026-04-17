# Project FISHBOOKER - Data Model Draft

## 1. Tujuan

Dokumen ini mendefinisikan struktur data minimum untuk mendukung:

- Audit transaksi reservasi dan validasi pembayaran.
- Evaluasi tingkat okupansi lapak dan performa finansial.
- Manajemen siklus hidup lapak (_maintenance_ & _dynamic pricing_).
- Keamanan data pelanggan dan integritas role access.

---

## 2. Entitas PostgreSQL (atau MySQL)

### 2.1 site_configurations

Menyimpan pengaturan aktif operasional kolam.

**Kolom utama:**

- `id` (uuid, pk)
- `pool_name` (text)
- `opening_hour` (time)
- `closing_hour` (time)
- `max_booking_per_user` (int)
- `dynamic_pricing_enabled` (boolean)
- `weekend_surcharge_percent` (numeric)
- `updated_by` (text)
- `updated_at` (timestamptz)

---

### 2.2 slots

Snapshot status dan konfigurasi fisik lapak.

**Kolom utama:**

- `id` (bigint, pk)
- `slot_number` (text, unique)
- `base_price` (numeric)
- `current_price` (numeric) — hasil kalkulasi jika ada surcharge
- `status` (text) — `TERSEDIA`, `DIBOOKING`, `PERBAIKAN`
- `coordinates` (jsonb) — titik X, Y untuk UI Map
- `last_maintenance_at` (timestamptz)

---

### 2.3 bookings

Data inti reservasi dan lifecycle pesanan.

**Kolom utama:**

- `id` (uuid, pk)
- `user_id` (uuid, fk -> users.id)
- `slot_id` (bigint, fk -> slots.id)
- `booking_code` (text, unique)
- `total_amount` (numeric)
- `payment_status` (text) — `PENDING`, `PAID`, `EXPIRED`, `FAILED`
- `snap_token` (text, null) — untuk integrasi Midtrans
- `payment_method` (text, null)
- `expires_at` (timestamptz) — deadline pembayaran
- `created_at` (timestamptz)

---

### 2.4 financial_journals

Audit trail pergerakan uang yang masuk ke sistem.

**Kolom utama:**

- `id` (bigint, pk)
- `booking_id` (uuid, fk -> bookings.id)
- `amount` (numeric)
- `entry_type` (text) — `CREDIT` (Masuk), `DEBIT` (Refund)
- `description` (text)
- `reference_id` (text) — ID dari Payment Gateway
- `created_at` (timestamptz)

---

### 2.5 user_activity_logs

Mencatat aktivitas kritikal untuk keamanan dan audit.

**Kolom utama:**

- `id` (bigserial, pk)
- `user_id` (uuid, fk -> users.id)
- `action_type` (text) — `LOGIN`, `CREATE_BOOKING`, `CANCEL_BOOKING`, `CHANGE_PRICE`
- `payload` (jsonb) — data detail perubahan
- `ip_address` (text)
- `created_at` (timestamptz)

---

### 2.6 daily_summaries

Output analisis harian untuk dashboard admin (_pre-aggregated data_).

**Kolom utama:**

- `id` (uuid, pk)
- `report_date` (date, unique)
- `total_revenue` (numeric)
- `total_bookings` (int)
- `occupancy_rate` (numeric)
- `most_booked_slot` (text)
- `status` (text) — `FINALIZED`, `DRAFT`

---

## 3. Redis Keys (Draft)

- `fishbooker:slot_lock:{slot_id}` → Mengunci slot saat checkout (TTL 15 menit)
- `fishbooker:session:{user_id}` → Token auth session
- `fishbooker:stats:daily_temp` → Counter pendapatan sementara hari ini
- `fishbooker:active_users` → Set user yang sedang online di denah

---

## 4. Indexing Guidance

- `bookings(user_id, payment_status)`
- `bookings(booking_code)`
- `slots(status, current_price)`
- `financial_journals(created_at desc)`
- `user_activity_logs(user_id, action_type)`

---

## 5. Audit and Traceability

Setiap record finansial dan perubahan status wajib memiliki:

- `correlation_id` → tracking log dari request frontend ke database
- `admin_ref` → jika perubahan dilakukan manual oleh admin
- `version_snapshot` → keadaan data sebelum diubah

---

## Analisis Upgrade

### Financial Journals

Kita pisahkan dari tabel booking agar setiap pergerakan uang (termasuk refund atau diskon manual) punya jejak audit yang bersih.

### Site Configurations

Admin bisa mengatur **Global Rules** kolam tanpa perlu menyentuh file `.env`.

### Activity Logs

Penting untuk mengetahui siapa yang mengubah harga lapak atau siapa yang membatalkan booking.

### UUID vs BigInt

Menggunakan UUID untuk entitas yang terekspos ke publik (`bookings`, `users`) dan BigInt untuk data internal (`slots`) demi performa
