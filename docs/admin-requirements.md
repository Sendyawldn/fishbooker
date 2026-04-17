# FISHBOOKER - Admin Requirement & Operations

## 1. Dashboard & Monitoring (The Command Center)

Tugas utama: Memberikan visibilitas total terhadap kondisi kolam secara real-time.

- **Map Observability**: Admin wajib melihat visualisasi denah kolam yang sinkron dengan status database (`active`, `booked`, `maintenance`).
- **Financial Pulse**: Penampilan metrik pendapatan kotor (Gross Revenue) hari ini dibandingkan dengan target harian.
- **Occupancy Tracking**: Persentase keterisian lapak untuk menentukan efisiensi jam operasional.

## 2. Inventory & Pricing Control (The Management)

Tugas: Memberikan fleksibilitas bagi owner untuk mengatur aset tanpa mengubah kode.

- **Dynamic Price Adjuster**: Fitur untuk mengubah harga lapak secara instan (contoh: menaikkan harga saat sesi "Ikan Baru Turun" atau saat Weekend).
- **Maintenance Override**: Kemampuan untuk melakukan "Lock" manual pada lapak yang rusak/sedang dibersihkan agar tidak muncul di daftar booking pelanggan.
- **Session Management**: Mengatur durasi waktu mancing per sesi (misal: Sesi Galatama 4 Jam).

## 3. Financial & Audit Trail (The Accounting)

Tugas: Memastikan setiap rupiah yang masuk tercatat dan bisa dipertanggungjawabkan.

- **Manual Payment Confirmation**: Tombol validasi untuk pelanggan yang membayar tunai (Cash) di lokasi, yang akan memicu update status di database.
- **Transaction Journal**: Log permanen yang mencatat `siapa` membayar `berapa` untuk `lapak apa` dan `kapan`. Tidak ada data keuangan yang boleh dihapus (Immutable).
- **Export Reporting**: Kemampuan untuk mengunduh laporan keuangan mingguan/bulanan dalam format CSV/Excel untuk keperluan arsip owner.

## 4. User & Risk Governance (The Shield)

Tugas: Melindungi sistem dari penyalahgunaan.

- **Booking Limit**: Membatasi satu user agar tidak bisa mem-booking semua lapak sekaligus (mencegah spam).
- **Blacklist System**: Fitur untuk memblokir akun/nomor HP pelanggan yang sering melakukan "Booking Palsu" (booking tapi tidak bayar).
- **Kill Switch**: Tombol darurat untuk menghentikan seluruh sistem reservasi jika terjadi gangguan pada sistem pembayaran atau kerusakan massal di kolam.

## 5. Definition of Done (DoD) - Admin Module

Fitur dianggap selesai jika:

- Admin bisa mengubah harga lapak dan perubahan langsung terlihat di Frontend Pelanggan.
- Log transaksi keuangan muncul secara otomatis setelah booking dikonfirmasi.
- Perubahan status lapak ke `Maintenance` berhasil menghilangkan tombol booking di sisi pelanggan.
