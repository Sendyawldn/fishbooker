<?php

namespace App\Services\Operations;

use App\Models\Booking;
use App\Models\Payment;

class PaymentHealthService
{
    /**
     * @return array<string, int|bool>
     */
    public function buildSummary(?int $minutesThreshold = null): array
    {
        $resolvedMinutesThreshold = max(
            $minutesThreshold ?? (int) config('payment.health_check_minutes_threshold', 20),
            1,
        );
        $staleThreshold = now()->subMinutes($resolvedMinutesThreshold);

        $stalePendingPayments = Payment::query()
            ->where('status', 'PENDING')
            ->where('created_at', '<=', $staleThreshold)
            ->count();

        $expiredPendingBookings = Booking::query()
            ->where('status', 'PENDING')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->count();

        return [
            'minutes_threshold' => $resolvedMinutesThreshold,
            'stale_pending_payments' => $stalePendingPayments,
            'expired_pending_bookings' => $expiredPendingBookings,
            'needs_attention' => $stalePendingPayments > 0 || $expiredPendingBookings > 0,
        ];
    }
}
