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
