<?php

namespace App\Services\Bookings;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\Payments\PaymentWebhookService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminBookingOperationsService
{
    public function __construct(
        private readonly BookingLifecycleService $bookingLifecycleService,
        private readonly PaymentWebhookService $paymentWebhookService,
    ) {
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function paginateBookings(array $filters): LengthAwarePaginator
    {
        $perPage = min(max((int) ($filters['per_page'] ?? 20), 1), 50);
        $status = isset($filters['status']) && is_string($filters['status']) ? $filters['status'] : null;
        $paymentStatus = isset($filters['payment_status']) && is_string($filters['payment_status'])
            ? $filters['payment_status']
            : null;
        $customerAccess = isset($filters['customer_access']) && is_string($filters['customer_access'])
            ? $filters['customer_access']
            : null;
        $search = isset($filters['search']) && is_string($filters['search']) ? trim($filters['search']) : null;

        return Booking::query()
            ->with([
                'slot:id,slot_number,status,price,created_at,updated_at',
                'user:id,name,email,role,is_booking_blocked,booking_block_reason',
                'latestPayment',
            ])
            ->when($status && $status !== 'ALL', function ($query) use ($status): void {
                $query->where('status', $status);
            })
            ->when($paymentStatus && $paymentStatus !== 'ALL', function ($query) use ($paymentStatus): void {
                if ($paymentStatus === 'NONE') {
                    $query->whereDoesntHave('latestPayment');

                    return;
                }

                $query->whereHas('latestPayment', function ($paymentQuery) use ($paymentStatus): void {
                    $paymentQuery->where('status', $paymentStatus);
                });
            })
            ->when($customerAccess && $customerAccess !== 'ALL', function ($query) use ($customerAccess): void {
                $query->whereHas('user', function ($userQuery) use ($customerAccess): void {
                    $userQuery->where(
                        'is_booking_blocked',
                        $customerAccess === 'BLOCKED',
                    );
                });
            })
            ->when($search, function ($query) use ($search): void {
                $query->where(function ($nestedQuery) use ($search): void {
                    $nestedQuery->whereHas('user', function ($userQuery) use ($search): void {
                        $userQuery
                            ->where('name', 'like', '%'.$search.'%')
                            ->orWhere('email', 'like', '%'.$search.'%');
                    });

                    if (is_numeric($search)) {
                        $nestedQuery->orWhereHas('slot', function ($slotQuery) use ($search): void {
                            $slotQuery->where('slot_number', (int) $search);
                        });
                    }
                });
            })
            ->orderByDesc('booking_time')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    public function cancelPendingBooking(Booking $booking, User $adminUser, ?string $note = null): Booking
    {
        if ($adminUser->role !== 'ADMIN') {
            throw ValidationException::withMessages([
                'booking' => 'Hanya admin yang bisa membatalkan booking.',
            ]);
        }

        return DB::transaction(function () use ($booking, $adminUser, $note): Booking {
            $lockedBooking = Booking::query()
                ->with(['slot', 'user', 'latestPayment'])
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedBooking->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'booking' => 'Hanya booking berstatus PENDING yang bisa dibatalkan.',
                ]);
            }

            /** @var Payment|null $latestPayment */
            $latestPayment = $lockedBooking->latestPayment;

            if ($latestPayment && $latestPayment->status === 'PENDING') {
                $this->paymentWebhookService->expirePendingExternalPayment($latestPayment);

                $latestPayment->forceFill([
                    'status' => 'CANCELLED',
                    'expires_at' => null,
                    'metadata' => array_merge($latestPayment->metadata ?? [], [
                        'cancelled_by_admin_id' => $adminUser->id,
                        'cancelled_note' => $note,
                        'cancelled_at' => now()->toISOString(),
                    ]),
                ])->save();
            }

            return $this->bookingLifecycleService->cancelBooking($lockedBooking)->fresh([
                'slot',
                'user',
                'latestPayment',
            ]);
        });
    }
}
