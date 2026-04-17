# Project FISHBOOKER - Operations Runbook

## 1. Overview

Runbook ini mencakup tugas operasional untuk menjalankan FISHBOOKER di lingkungan produksi dan pengembangan, termasuk prosedur pemeliharaan dan respon insiden.

---

## 2. Weekly & Daily Operations Workflow

### 2.1 Automated Cleanup (Scheduler Mode)

Sistem menjalankan pembersihan otomatis untuk booking yang kedaluwarsa (tidak dibayar dalam 15 menit):

```bash
cd backend
./vendor/bin/sail artisan schedule:work
```

Tugas ini akan memeriksa tabel `bookings` setiap menit dan mengubah status menjadi `EXPIRED` serta membebaskan slots.

### 2.2 Manual Maintenance Trigger

Jika perlu memicu pembersihan secara manual via CLI:

```bash
./vendor/bin/sail artisan booking:clear-expired
```

Atau via API (Admin Only):

```bash
curl -X POST http://localhost:8000/api/v1/admin/maintenance/clear-expired \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## 3. Governance Operations (Management)

### List Active Bookings

```bash
./vendor/bin/sail artisan booking:list --status=pending
```

### Approve/Verify Payment Manually (Offline Payment)

Jika pelanggan membayar cash di tempat:

```bash
./vendor/bin/sail artisan booking:verify <BOOKING_ID>
```

### Slot Maintenance Control

Menutup lapak untuk perbaikan:

```bash
./vendor/bin/sail artisan slot:set-status <SLOT_NUMBER> maintenance
```

---

## 4. Monitoring & Health Check

### API Health Check

```bash
curl http://localhost:8000/api/health
```

**Response:**

```json
{ "status": "healthy", "version": "1.0.0", "database": "connected" }
```

### Application Logs

Melihat log error Laravel secara real-time:

```bash
tail -f backend/storage/logs/laravel.log
```

### Redis Monitoring (Slot Locking)

```bash
./vendor/bin/sail redis-cli monitor
```

---

## 5. Incident Response (Penanganan Masalah)

### API Service Down

1. Cek status container: `docker ps`
2. Restart Sail: `./vendor/bin/sail restart`
3. Jika database korup: Jalankan `sail artisan migrate:fresh --seed`
   > ⚠️ **Peringatan:** Data akan hilang!

### Webhook Midtrans Tidak Masuk

1. Cek koneksi internet server.
2. Verifikasi `MIDTRANS_SERVER_KEY` di `.env`.
3. Gunakan dashboard Midtrans untuk melakukan **"Resend Webhook"**.

### Sistem Melambat (High Latency)

1. Bersihkan cache:
   ```bash
   sail artisan cache:clear
   ```
2. Optimasi database:
   ```bash
   sail artisan model:prune
   ```

---

## 6. Deployment Checklist (Pre-Live)

- [ ] Environment variables `.env` sudah menggunakan mode production.
- [ ] `APP_KEY` sudah di-generate.
- [ ] Database migration sudah dijalankan.
- [ ] Folder `storage/` dan `bootstrap/cache/` memiliki izin akses write.
- [ ] Midtrans Production Key sudah aktif.
- [ ] SSL Certificate (HTTPS) aktif di domain.

---

## 7. Performance Baseline

| Metrik                 | Target                        |
| ---------------------- | ----------------------------- |
| API Response Time      | < 200ms untuk discovery lapak |
| Booking Transaction    | < 1s (Atomic Transaction)     |
| Frontend Load (Vercel) | LCP < 1.2s                    |

---

## 8. Backup & Data Retention

| Item              | Ketentuan                                                   |
| ----------------- | ----------------------------------------------------------- |
| Database Backup   | Dilakukan setiap jam 00:00 (WIB)                            |
| Log Retention     | Log aplikasi disimpan selama 30 hari                        |
| Financial Records | Disimpan permanen (Immutable) di tabel `financial_journals` |

---
