# Local Development Setup Guide

## 1. Prerequisites

Sebelum memulai, pastikan mesin lokal kamu sudah terinstall software berikut:

- **Docker Desktop**: Untuk menjalankan Laravel Sail.
- **Node.js (v20+) & npm**: Untuk menjalankan frontend Next.js.
- **Composer**: Untuk manajemen dependensi PHP (opsional jika menggunakan Sail).
- **Git**: Untuk manajemen versi.

## 2. Backend Setup (Laravel 12)

### Step 1: Clone and Environment

```bash
cd backend
cp .env.example .env
```

Pastikan mengedit `.env` untuk konfigurasi Database dan Midtrans Sandbox Keys.

### Step 2: Install Dependencies via Docker Sail

```bash
docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$(pwd):/var/www/html" \
    -w /var/www/html" \
    laravelsail/php84-composer:latest \
    composer install --ignore-platform-reqs
```

### Step 3: Booting the Infrastructure

```bash
./vendor/bin/sail up -d
```

### Step 4: Database Initialization

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
```

## 3. Frontend Setup (Next.js 15)

### Step 1: Install Package

```bash
cd frontend
npm install
```

### Step 2: Environment Setup

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key_here
```

### Step 3: Run Development Server

```bash
npm run dev
```

Aplikasi tersedia di http://localhost:3000

## 4. Connectivity Verification

- Check Backend API: http://localhost:8000/api/health
- Check Auth Session: login pakai akun seeder
- Check Redis:

```bash
./vendor/bin/sail redis-cli monitor
```

## 5. Common CLI Commands

- Reset DB & Seed: `./vendor/bin/sail artisan migrate:fresh --seed`
- Run Tests: `./vendor/bin/sail artisan test`
- Lint Frontend: `npm run lint`
- Clear Cache: `./vendor/bin/sail artisan optimize:clear`

## 6. Troubleshooting

### Docker Port Conflict

Ubah `APP_PORT` atau `FORWARD_DB_PORT` di `.env`

### Node Modules Error

```bash
rm -rf node_modules package-lock.json
npm install
```

### Permission Denied (Linux)

```bash
sudo chown -R $USER:$USER backend/storage
```
