# FishBooker Frontend

Next.js 16 frontend for customer booking, Midtrans sandbox payment flow, admin slot management, admin booking operations, and admin analytics.

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
- payment detail route with Midtrans checkout handoff
- admin slots, admin booking operations, and admin dashboard
- app router loading, error, and not-found recovery states
