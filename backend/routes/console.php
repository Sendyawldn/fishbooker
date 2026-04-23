<?php

use App\Models\Booking;
use App\Models\Payment;
use App\Services\Operations\OperationsAlertService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('payments:health-check {--minutes=20} {--alert}', function (OperationsAlertService $operationsAlertService) {
    $minutes = max((int) $this->option('minutes'), 1);
    $threshold = now()->subMinutes($minutes);

    $stalePendingPayments = Payment::query()
        ->where('status', 'PENDING')
        ->where('created_at', '<=', $threshold)
        ->count();

    $expiredPendingBookings = Booking::query()
        ->where('status', 'PENDING')
        ->whereNotNull('expires_at')
        ->where('expires_at', '<=', now())
        ->count();

    $this->table(
        ['check', 'count'],
        [
            ['pending_payments_older_than_threshold', $stalePendingPayments],
            ['expired_pending_bookings', $expiredPendingBookings],
        ],
    );

    if ($stalePendingPayments > 0 || $expiredPendingBookings > 0) {
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
