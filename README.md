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

```
fishbooker/
├── backend/          # API Server (Laravel)
├── frontend/         # Web UI (Next.js + React)
└── docs/             # Dokumentasi Teknis
```

### Backend

- **Framework**: Laravel (PHP)
- **Database**: MySQL/PostgreSQL
- **API**: RESTful API
- **Authentication**: JWT Token
- **Real-time**: WebSocket untuk live updates

### Frontend

- **Framework**: Next.js 16.2.3
- **UI Library**: React 19.2.4 + Shadcn UI
- **Styling**: Tailwind CSS
- **State Management**: TBD
- **TypeScript**: Full type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PHP 8.1+
- Composer
- Docker & Docker Compose (optional)
- MySQL 8.0+ atau PostgreSQL 13+

### Setup Lokal

#### 1. Clone Repository

```bash
git clone https://github.com/Sendyawldn/fishbooker.git
cd fishbooker
```

#### 2. Setup Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Backend akan berjalan di: `http://localhost:8000`

#### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

### Menggunakan Docker Compose

```bash
docker-compose up -d
```

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder `docs/`:

- [**Architecture**](./docs/architecture.md) - Blueprint arsitektur sistem
- [**Data Model**](./docs/data-model.md) - Struktur database dan relasi
- [**API Documentation**](./docs/api.md) - Endpoint dan contract API
- [**Local Dev Setup**](./docs/local-dev-setup.md) - Panduan setup development
- [**Roadmap**](./docs/roadmap.md) - Rencana pengembangan fitur
- [**Admin Requirements**](./docs/admin-requirements.md) - Requirement admin
- [**Runbook**](./docs/runbook.md) - Panduan deployment dan troubleshooting

## 🛠️ Development

### Struktur Folder

```
backend/
├── app/                    # Business Logic
├── config/                 # Configuration Files
├── database/               # Migrations & Seeds
├── routes/                 # API Routes
├── tests/                  # Test Cases
└── ...

frontend/
├── app/                    # Next.js App Router
├── components/             # React Components
├── lib/                    # Utilities & Helpers
├── public/                 # Static Assets
└── ...
```

### Commands

**Backend:**

```bash
# Database
php artisan migrate              # Run migrations
php artisan migrate:rollback     # Rollback migrations
php artisan db:seed              # Seed database

# Testing
php artisan test                 # Run tests

# Development
php artisan serve                # Start development server
php artisan queue:work           # Start queue worker
```

**Frontend:**

```bash
# Development
npm run dev                      # Start dev server

# Production
npm run build                    # Build for production
npm start                        # Start production server

# Linting
npm run lint                     # Run ESLint
```

## 🔐 Environment Variables

### Backend (.env)

```
APP_NAME=FISHBOOKER
APP_ENV=local
APP_DEBUG=true
APP_KEY=
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=fishbooker
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=your_jwt_secret
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=FISHBOOKER
```

## 📊 Key Concepts

### Real-time Slot Locking

Sistem yang memastikan tidak ada double booking dengan menggunakan optimistic locking di database dan WebSocket untuk live updates.

### Transaction Integrity

Setiap transaksi reservasi dan finansial dijamin atomicity melalui database transactions.

### API Contract

API dirancang dengan RESTful principles dan menggunakan standardized response format.

## 🧪 Testing

### Backend Testing

```bash
cd backend
php artisan test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 🚢 Deployment

Untuk deployment ke production, lihat panduan di [Runbook](./docs/runbook.md).

### Docker Build

```bash
docker build -f backend/Dockerfile -t fishbooker-backend .
docker build -f frontend/Dockerfile -t fishbooker-frontend .
```

## 🤝 Contributing

Kami menerima kontribusi! Silakan:

1. Fork repository ini
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan Anda (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

### Coding Standards

- Backend: PSR-12 (Laravel conventions)
- Frontend: ESLint config
- Commit messages: Conventional Commits

## 📝 License

Proyek ini dilisensikan di bawah MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 👥 Tim

**Project Owner:** [Sendyawldn](https://github.com/Sendyawldn)

## 📧 Support

Untuk pertanyaan atau bantuan, silakan:

- Buat [Issue](https://github.com/Sendyawldn/fishbooker/issues) baru
- Hubungi melalui email support

## 🗺️ Roadmap

Fitur-fitur yang akan datang:

- [ ] Mobile App (React Native)
- [ ] Payment Gateway Integration
- [ ] Advanced Analytics Dashboard
- [ ] Multi-language Support
- [ ] Notification System (Email/SMS/Push)
- [ ] API Rate Limiting & Monitoring
- [ ] Audit Logging

Lihat [Full Roadmap](./docs/roadmap.md) untuk detail lengkap.

---

**Last Updated**: 2026-04-17 | **Status**: 🟢 Active Development
