# FishBooker Frontend

Next.js 16 frontend for customer booking, payment sandbox flow, admin slot management, and admin analytics.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Quality Checks

```bash
npm run lint
npm test
npm run build
```

## Current Scope

- homepage with interactive pond map
- login dialog backed by same-origin BFF routes
- booking history route
- payment detail and simulation route
- admin slots and admin dashboard
- app router loading, error, and not-found recovery states
