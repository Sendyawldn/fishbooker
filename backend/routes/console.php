<?php

use App\Services\Operations\OperationsAlertService;
use App\Services\Operations\PaymentHealthService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('payments:health-check {--minutes=20} {--alert}', function (
    OperationsAlertService $operationsAlertService,
    PaymentHealthService $paymentHealthService,
) {
    $healthSummary = $paymentHealthService->buildSummary((int) $this->option('minutes'));
    $minutes = (int) $healthSummary['minutes_threshold'];
    $stalePendingPayments = (int) $healthSummary['stale_pending_payments'];
    $expiredPendingBookings = (int) $healthSummary['expired_pending_bookings'];

    $this->table(
        ['check', 'count'],
        [
            ['pending_payments_older_than_threshold', $stalePendingPayments],
            ['expired_pending_bookings', $expiredPendingBookings],
        ],
    );

    if ((bool) $healthSummary['needs_attention']) {
        if ((bool) $this->option('alert')) {
            $operationsAlertService->sendPaymentHealthAlert(
                'FishBooker mendeteksi payment atau booking stale state.',
                [
                    'minutes' => $minutes,
                    'pending_payments_older_than_threshold' => $stalePendingPayments,
                    'expired_pending_bookings' => $expiredPendingBookings,
                ],
            );
        }

        $this->error('FishBooker payment health check detected stale payment or booking state.');

        return 1;
    }

    $this->info('FishBooker payment health check is healthy.');

    return 0;
})->purpose('Detect pending payments or bookings that need operational attention');

Artisan::command('release:external-readiness {--production}', function () {
    $checkResults = [];

    $backendUrl = (string) config('app.url');
    $frontendUrl = (string) config('app.frontend_url');
    $midtransServerKey = (string) config('services.midtrans.server_key');
    $midtransClientKey = (string) config('services.midtrans.client_key');
    $midtransIsProduction = (bool) config('services.midtrans.is_production', false);
    $midtransDemoMode = (bool) config('services.midtrans.demo_mode', false);
    $operationsAlertWebhookUrl = (string) config('payment.operations_alert_webhook_url');
    $isProductionTarget = (bool) $this->option('production');

    $checkResults[] = [
        'check' => 'backend_url_configured',
        'status' => $backendUrl !== '' ? 'PASS' : 'FAIL',
        'details' => $backendUrl !== '' ? $backendUrl : 'APP_URL is empty.',
    ];

    $checkResults[] = [
        'check' => 'frontend_url_configured',
        'status' => $frontendUrl !== '' ? 'PASS' : 'FAIL',
        'details' => $frontendUrl !== '' ? $frontendUrl : 'FRONTEND_URL is empty.',
    ];

    if ($isProductionTarget) {
        $checkResults[] = [
            'check' => 'backend_url_not_localhost',
            'status' => str_contains($backendUrl, 'localhost') ? 'FAIL' : 'PASS',
            'details' => str_contains($backendUrl, 'localhost')
                ? 'APP_URL still points to localhost.'
                : $backendUrl,
        ];

        $checkResults[] = [
            'check' => 'frontend_url_not_localhost',
            'status' => str_contains($frontendUrl, 'localhost') ? 'FAIL' : 'PASS',
            'details' => str_contains($frontendUrl, 'localhost')
                ? 'FRONTEND_URL still points to localhost.'
                : $frontendUrl,
        ];
    }

    $checkResults[] = [
        'check' => 'midtrans_server_key_present',
        'status' => $midtransServerKey !== '' ? 'PASS' : 'FAIL',
        'details' => $midtransServerKey !== '' ? 'Configured.' : 'MIDTRANS_SERVER_KEY is empty.',
    ];

    $checkResults[] = [
        'check' => 'midtrans_client_key_present',
        'status' => $midtransClientKey !== '' ? 'PASS' : 'FAIL',
        'details' => $midtransClientKey !== '' ? 'Configured.' : 'MIDTRANS_CLIENT_KEY is empty.',
    ];

    $checkResults[] = [
        'check' => 'midtrans_production_mode',
        'status' => $midtransIsProduction ? 'PASS' : ($isProductionTarget ? 'FAIL' : 'WARN'),
        'details' => $midtransIsProduction
            ? 'MIDTRANS_IS_PRODUCTION=true'
            : 'MIDTRANS_IS_PRODUCTION is still false.',
    ];

    $checkResults[] = [
        'check' => 'midtrans_demo_mode_disabled',
        'status' => ! $midtransDemoMode ? 'PASS' : ($isProductionTarget ? 'FAIL' : 'WARN'),
        'details' => ! $midtransDemoMode
            ? 'MIDTRANS_DEMO_MODE=false'
            : 'MIDTRANS_DEMO_MODE is still true.',
    ];

    $isAlertWebhookConfigured = $operationsAlertWebhookUrl !== ''
        && filter_var($operationsAlertWebhookUrl, FILTER_VALIDATE_URL) !== false;

    $checkResults[] = [
        'check' => 'operations_alert_webhook',
        'status' => $isAlertWebhookConfigured ? 'PASS' : 'WARN',
        'details' => $isAlertWebhookConfigured
            ? $operationsAlertWebhookUrl
            : 'OPERATIONS_ALERT_WEBHOOK_URL is missing or invalid.',
    ];

    $this->table(['check', 'status', 'details'], $checkResults);

    $hasFailingCheck = collect($checkResults)->contains(
        fn (array $result): bool => $result['status'] === 'FAIL',
    );

    if ($hasFailingCheck) {
        $this->error('FishBooker external readiness check found blocking gaps.');

        return 1;
    }

    if (collect($checkResults)->contains(fn (array $result): bool => $result['status'] === 'WARN')) {
        $this->warn('FishBooker external readiness check passed with warnings.');

        return 0;
    }

    $this->info('FishBooker external readiness check is fully ready from the repository side.');

    return 0;
})->purpose('Validate repo-side readiness for production credentials, alert routing, and contract publishing');
