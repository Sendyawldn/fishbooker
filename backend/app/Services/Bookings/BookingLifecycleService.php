<?php

namespace App\Services\Bookings;

use App\Models\Booking;
use App\Models\Slot;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class BookingLifecycleService
{
    public function cancelExpiredBookingsForUser(int $userId): void
    {
        $now = now();

        $expiredBookings = Booking::query()
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now)
            ->get(['id', 'slot_id']);

        $this->cancelBookingCollection($expiredBookings, $now);
    }

    public function cancelExpiredBookingsForSlot(int $slotId): void
    {
        $now = now();

        $expiredBookings = Booking::query()
            ->where('slot_id', $slotId)
            ->where('status', 'PENDING')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now)
            ->get(['id', 'slot_id']);

        $this->cancelBookingCollection($expiredBookings, $now);
    }

    public function cancelBooking(Booking $booking): Booking
    {
        if ($booking->status !== 'PENDING') {
            return $booking;
        }

        $booking->forceFill([
            'status' => 'CANCELLED',
        ])->save();

        $this->releaseSlotIfAvailable($booking->slot_id);

        return $booking->fresh(['slot']);
    }

    public function markBookingPaid(Booking $booking, CarbonInterface $paidAt): Booking
    {
        $booking->forceFill([
            'status' => 'SUCCESS',
            'expires_at' => null,
            'paid_at' => $paidAt,
        ])->save();

        Slot::query()
            ->whereKey($booking->slot_id)
            ->update(['status' => 'DIBOOKING']);

        return $booking->fresh(['slot']);
    }

    public function isExpiredPendingBooking(Booking $booking): bool
    {
        if ($booking->status !== 'PENDING') {
            return false;
        }

        if (! $booking->expires_at) {
            return false;
        }

        return $booking->expires_at->isPast();
    }

    private function cancelBookingCollection(Collection $expiredBookings, CarbonInterface $now): void
    {
        if ($expiredBookings->isEmpty()) {
            return;
        }

        Booking::query()
            ->whereIn('id', $expiredBookings->pluck('id'))
            ->update(['status' => 'CANCELLED']);

        foreach ($expiredBookings->pluck('slot_id')->unique() as $slotId) {
            $hasActiveHold = Booking::query()
                ->where('slot_id', $slotId)
                ->where('status', 'PENDING')
                ->where('expires_at', '>', $now)
                ->exists();

            if (! $hasActiveHold) {
                Slot::query()
                    ->whereKey($slotId)
                    ->where('status', 'DIBOOKING')
                    ->update(['status' => 'TERSEDIA']);
            }
        }
    }

    private function releaseSlotIfAvailable(int $slotId): void
    {
        $now = now();

        $hasActiveHold = Booking::query()
            ->where('slot_id', $slotId)
            ->where('status', 'PENDING')
            ->where(function ($query) use ($now): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            })
            ->exists();

        $hasSuccessfulBooking = Booking::query()
            ->where('slot_id', $slotId)
            ->where('status', 'SUCCESS')
            ->exists();

        if ($hasActiveHold || $hasSuccessfulBooking) {
            return;
        }

        Slot::query()
            ->whereKey($slotId)
            ->where('status', 'DIBOOKING')
            ->update(['status' => 'TERSEDIA']);
    }
}
