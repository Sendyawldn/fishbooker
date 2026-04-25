# FishBooker External Activation Checklist

Last reviewed: 2026-04-25

## Scope

This checklist covers the remaining steps that must be completed outside the repository:

- production Midtrans credential rollout
- alert and observability platform hookup
- GitHub Pages environment activation for published contracts

The code and workflows in this repository are already prepared for these steps. The items below describe what still needs to be done in external systems.

Before touching external systems, run this repo-side validation first:

```bash
cd backend
./vendor/bin/sail artisan release:external-readiness --production
```

## 1. Midtrans Production Rollout

Environment values to update in the backend deployment target:

- `PAYMENT_PROVIDER=MIDTRANS`
- `MIDTRANS_PAYMENT_PROVIDER=MIDTRANS`
- `MIDTRANS_SERVER_KEY=<production server key>`
- `MIDTRANS_CLIENT_KEY=<production client key>`
- `MIDTRANS_IS_PRODUCTION=true`
- `MIDTRANS_DEMO_MODE=false`
- `MIDTRANS_ENABLED_PAYMENTS=<provider list required by the business>`

Environment values to review in the frontend deployment target:

- `NEXT_PUBLIC_API_BASE_URL=<production backend url>`
- `AUTH_SESSION_COOKIE_SECRET=<unique production secret>`
- `AUTH_SESSION_MAX_AGE_SECONDS=<approved session lifetime>`
- remove `MIDTRANS_WEBHOOK_SIMULATION_SERVER_KEY` unless local simulation is intentionally kept outside production

Production rollout checks:

1. Confirm sandbox keys are removed from the production environment.
2. Confirm Midtrans points webhook notifications to the deployed backend `POST /api/v1/payments/webhooks/midtrans`.
3. Confirm `APP_URL` and `FRONTEND_URL` match the deployed domains.
4. Run one real payment in a safe production test scenario and confirm booking, payment, and journal state all settle correctly.
5. Confirm local simulation routes are not used as a substitute for live production payment verification.

## 2. Alert And Observability Routing

Backend alert delivery:

- Set `OPERATIONS_ALERT_WEBHOOK_URL=<destination webhook>` in the backend environment.
- `php artisan payments:health-check --alert` sends JSON with:
  - `event`
  - `summary`
  - `context`
  - `timestamp`

Example alert payload shape:

```json
{
  "event": "fishbooker.payment_health_alert",
  "summary": "FishBooker mendeteksi payment atau booking stale state.",
  "context": {
    "minutes": 20,
    "pending_payments_older_than_threshold": 1,
    "expired_pending_bookings": 2
  },
  "timestamp": "2026-04-25T02:30:00.000000Z"
}
```

Frontend structured log families already emitted by the BFF layer:

- `frontend.auth.*`
- `frontend.bookings.*`
- `frontend.payments.*`
- `frontend.admin.dashboard.*`
- `frontend.admin.bookings.*`
- `frontend.admin.customers.*`
- `frontend.admin.booking_controls.*`
- `frontend.admin.slots.*`
- `frontend.admin.finance_export.*`
- `frontend.admin.cash_confirm.*`

External platform setup checks:

1. Decide the destination platform for webhook alerts and log search.
2. Route backend application logs and Next.js server logs into the same searchable store when possible.
3. Preserve the frontend `requestId` field so a BFF error can be correlated with backend logs.
4. Create alerts for:
   - non-zero `payments:health-check --alert`
   - repeated `frontend.*.backend_error`
   - repeated `frontend.*.unhandled_error`
   - repeated `payments.midtrans_webhook.*` failure-like events in backend logs

## 3. GitHub Pages Activation

The repository already contains `.github/workflows/publish-api-contract.yml`, but GitHub Pages still needs repository-level activation.

Repository settings steps:

1. Open `Settings -> Pages`.
2. Ensure GitHub Pages is enabled for the repository.
3. Allow the `github-pages` environment if GitHub asks for environment approval.
4. Keep source managed by GitHub Actions.
5. Trigger the `Publish API Contract` workflow manually once or push a docs change to `main`.
6. Confirm the published site exposes:
   - `contracts/openapi.yaml`
   - `contracts/api.md`
   - `contracts/deployment.md`

## Completion Gate

These three external tasks are considered complete only when:

1. Production Midtrans credentials are active and a real payment settles successfully.
2. Alert and log data are visible in the chosen observability platform with request correlation intact.
3. The GitHub Pages contract URL is reachable without relying on workflow artifacts alone.
