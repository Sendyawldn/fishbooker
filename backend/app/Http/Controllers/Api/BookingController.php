<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Slot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $this->cancelExpiredBookingsForUser($user->id);

        $bookings = Booking::query()
            ->with([
                'slot:id,slot_number,status,price,created_at,updated_at',
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('booking_time')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Riwayat booking berhasil diambil.',
            'data' => $bookings,
        ]);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $slotId = $request->integer('slot_id');
        $slotLock = Cache::lock("fishbooker:slot_lock:{$slotId}", 10);

        if (! $slotLock->get()) {
            return response()->json([
                'error' => 'SLOT_LOCKED',
                'message' => 'Lapak sedang diproses. Coba lagi beberapa detik lagi.',
            ], 422);
        }

        try {
            return DB::transaction(function () use ($slotId, $user): JsonResponse {
                $now = now();

                $slot = Slot::query()
                    ->whereKey($slotId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $expiredBookingIds = Booking::query()
                    ->where('slot_id', $slotId)
                    ->where('status', 'PENDING')
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '<=', $now)
                    ->pluck('id');

                if ($expiredBookingIds->isNotEmpty()) {
                    Booking::query()
                        ->whereIn('id', $expiredBookingIds)
                        ->update(['status' => 'CANCELLED']);

                    $slot->update(['status' => 'TERSEDIA']);
                    $slot->refresh();
                }

                $activeHoldBooking = Booking::query()
                    ->where('slot_id', $slotId)
                    ->where('status', 'PENDING')
                    ->where('expires_at', '>', $now)
                    ->latest('id')
                    ->first();

                if ($activeHoldBooking && $activeHoldBooking->user_id !== $user->id) {
                    return response()->json([
                        'error' => 'SLOT_LOCKED',
                        'message' => 'Lapak sedang dalam proses pembayaran oleh user lain.',
                        'locked_until' => $activeHoldBooking->expires_at?->toISOString(),
                    ], 422);
                }

                if ($activeHoldBooking && $activeHoldBooking->user_id === $user->id) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Lapak sudah Anda kunci sebelumnya.',
                        'valid_until' => $activeHoldBooking->expires_at?->toISOString(),
                        'data' => $activeHoldBooking,
                    ]);
                }

                if ($slot->status !== 'TERSEDIA') {
                    return response()->json([
                        'error' => 'SLOT_UNAVAILABLE',
                        'message' => 'Lapak tidak tersedia.',
                    ], 422);
                }

                $holdExpiresAt = $now->copy()->addMinutes(15);

                $booking = Booking::create([
                    'user_id' => $user->id,
                    'slot_id' => $slot->id,
                    'booking_time' => $now,
                    'expires_at' => $holdExpiresAt,
                    'status' => 'PENDING',
                ]);

                $slot->update(['status' => 'DIBOOKING']);

                return response()->json([
                    'success' => true,
                    'message' => 'Booking berhasil dibuat. Lapak terkunci selama 15 menit.',
                    'valid_until' => $holdExpiresAt->toISOString(),
                    'data' => $booking,
                ], 201);
            });
        } finally {
            $slotLock->release();
        }
    }

    private function cancelExpiredBookingsForUser(int $userId): void
    {
        $now = now();

        $expiredBookings = Booking::query()
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now)
            ->get(['id', 'slot_id']);

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
}
