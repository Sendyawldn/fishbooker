<?php

namespace App\Services\Reporting;

use App\Models\Booking;
use App\Models\FinancialJournal;
use App\Models\Payment;
use App\Models\Slot;
use Illuminate\Support\Carbon;

class AdminReportingService
{
    /**
     * @return array<string, mixed>
     */
    public function buildDashboard(): array
    {
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();
        $totalSlots = Slot::query()->count();
        $availableSlots = Slot::query()->where('status', 'TERSEDIA')->count();
        $maintenanceSlots = Slot::query()->where('status', 'PERBAIKAN')->count();
        $occupiedSlots = max($totalSlots - $availableSlots - $maintenanceSlots, 0);
        $activeHolds = Booking::query()
            ->where('status', 'PENDING')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->count();
        $pendingPayments = Payment::query()->where('status', 'PENDING')->count();
        $paidToday = Payment::query()
            ->where('status', 'PAID')
            ->whereNotNull('paid_at')
            ->where('paid_at', '>=', $todayStart)
            ->count();
        $grossRevenueToday = (int) FinancialJournal::query()
            ->where('entry_type', 'PAYMENT_CAPTURED')
            ->where('recorded_at', '>=', $todayStart)
            ->sum('amount');
        $grossRevenueMonth = (int) FinancialJournal::query()
            ->where('entry_type', 'PAYMENT_CAPTURED')
            ->where('recorded_at', '>=', $monthStart)
            ->sum('amount');

        return [
            'generated_at' => now()->toISOString(),
            'metrics' => [
                'total_slots' => $totalSlots,
                'available_slots' => $availableSlots,
                'maintenance_slots' => $maintenanceSlots,
                'occupied_slots' => $occupiedSlots,
                'active_holds' => $activeHolds,
                'pending_payments' => $pendingPayments,
                'paid_today' => $paidToday,
                'gross_revenue_today' => $grossRevenueToday,
                'gross_revenue_month' => $grossRevenueMonth,
                'occupancy_rate_percent' => $totalSlots > 0
                    ? round(($occupiedSlots / $totalSlots) * 100, 2)
                    : 0,
            ],
            'revenue_trend' => $this->buildRevenueTrend(),
            'slot_status_breakdown' => [
                [
                    'status' => 'TERSEDIA',
                    'count' => $availableSlots,
                ],
                [
                    'status' => 'DIBOOKING',
                    'count' => $occupiedSlots,
                ],
                [
                    'status' => 'PERBAIKAN',
                    'count' => $maintenanceSlots,
                ],
            ],
            'recent_transactions' => $this->buildRecentTransactions(),
            'pending_cash_payments' => $this->buildPendingCashPayments(),
        ];
    }

    public function exportFinanceCsv(): string
    {
        $rows = [];
        $rows[] = [
            'reference',
            'method',
            'amount',
            'currency',
            'status',
            'customer_name',
            'slot_number',
            'recorded_at',
        ];

        $payments = Payment::query()
            ->with(['booking.slot', 'booking.user'])
            ->where('status', 'PAID')
            ->orderByDesc('paid_at')
            ->get();

        foreach ($payments as $payment) {
            $rows[] = [
                $payment->reference,
                $payment->method,
                (string) $payment->amount,
                $payment->currency,
                $payment->status,
                $payment->booking->user->name,
                (string) $payment->booking->slot->slot_number,
                $payment->paid_at?->toISOString() ?? '',
            ];
        }

        return collect($rows)
            ->map(function (array $row): string {
                $escaped = array_map(function (string $value): string {
                    $normalized = str_replace('"', '""', $value);

                    return '"'.$normalized.'"';
                }, $row);

                return implode(',', $escaped);
            })
            ->implode("\n");
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRevenueTrend(): array
    {
        $days = collect(range(6, 0))
            ->map(fn (int $offset): Carbon => now()->startOfDay()->subDays($offset));

        return $days->map(function (Carbon $date): array {
            $dayEnd = $date->copy()->endOfDay();
            $grossRevenue = (int) FinancialJournal::query()
                ->where('entry_type', 'PAYMENT_CAPTURED')
                ->whereBetween('recorded_at', [$date, $dayEnd])
                ->sum('amount');
            $paidCount = Payment::query()
                ->where('status', 'PAID')
                ->whereBetween('paid_at', [$date, $dayEnd])
                ->count();

            return [
                'date' => $date->toDateString(),
                'gross_revenue' => $grossRevenue,
                'paid_count' => $paidCount,
            ];
        })->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildRecentTransactions(): array
    {
        return Payment::query()
            ->with(['booking.slot', 'booking.user'])
            ->latest('updated_at')
            ->limit(8)
            ->get()
            ->map(fn (Payment $payment): array => [
                'payment_id' => $payment->id,
                'reference' => $payment->reference,
                'method' => $payment->method,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'created_at' => $payment->created_at?->toISOString(),
                'paid_at' => $payment->paid_at?->toISOString(),
                'booking_id' => $payment->booking_id,
                'slot_number' => $payment->booking->slot->slot_number,
                'customer_name' => $payment->booking->user->name,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildPendingCashPayments(): array
    {
        return Payment::query()
            ->with(['booking.slot', 'booking.user'])
            ->where('status', 'PENDING')
            ->where('method', 'CASH')
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(fn (Payment $payment): array => [
                'payment_id' => $payment->id,
                'reference' => $payment->reference,
                'amount' => $payment->amount,
                'booking_id' => $payment->booking_id,
                'created_at' => $payment->created_at?->toISOString(),
                'slot_number' => $payment->booking->slot->slot_number,
                'customer_name' => $payment->booking->user->name,
            ])
            ->all();
    }
}
