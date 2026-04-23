<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Services\Bookings\BookingLifecycleService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly BookingLifecycleService $bookingLifecycleService,
    ) {
    }

    public function createOrReusePayment(Booking $booking, User $user, string $method): Payment
    {
        if ($booking->user_id !== $user->id && $user->role !== 'ADMIN') {
            throw new AuthorizationException('Anda tidak memiliki akses ke pembayaran booking ini.');
        }

        return DB::transaction(function () use ($booking, $user, $method): Payment {
            $lockedBooking = Booking::query()
                ->with('slot')
                ->whereKey($booking->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($this->bookingLifecycleService->isExpiredPendingBooking($lockedBooking)) {
                $this->bookingLifecycleService->cancelBooking($lockedBooking);

                throw ValidationException::withMessages([
                    'booking' => 'Hold booking sudah kedaluwarsa. Silakan buat booking baru.',
                ]);
            }

            if ($lockedBooking->status === 'SUCCESS') {
                throw ValidationException::withMessages([
                    'booking' => 'Booking ini sudah dibayar.',
                ]);
            }

            if ($lockedBooking->status !== 'PENDING') {
                throw ValidationException::withMessages([
                    'booking' => 'Booking tidak bisa diproses untuk pembayaran.',
                ]);
            }

            $existingPayment = Payment::query()
                ->where('booking_id', $lockedBooking->id)
                ->where('status', 'PENDING')
                ->latest('id')
                ->first();

            if ($existingPayment) {
                Log::info('payments.reused_pending_payment', [
                    'booking_id' => $lockedBooking->id,
                    'payment_id' => $existingPayment->id,
                    'user_id' => $lockedBooking->user_id,
                ]);

                return $existingPayment->fresh(['booking.slot']);
            }

            $checkoutUrl = rtrim((string) config('app.frontend_url'), '/').'/payments/';
            $reference = (string) Str::uuid();

            $payment = Payment::create([
                'booking_id' => $lockedBooking->id,
                'user_id' => $lockedBooking->user_id,
                'provider' => (string) config('services.manual_payment.provider', 'MANUAL'),
                'method' => $method,
                'status' => 'PENDING',
                'amount' => $lockedBooking->slot->price,
                'currency' => 'IDR',
                'reference' => $reference,
                'gateway_reference' => $reference,
                'checkout_url' => $checkoutUrl.$reference,
                'expires_at' => $lockedBooking->expires_at,
                'metadata' => [
                    'booking_time' => $lockedBooking->booking_time?->toISOString(),
                ],
            ]);

            Log::info('payments.created_pending_payment', [
                'booking_id' => $lockedBooking->id,
                'payment_id' => $payment->id,
                'user_id' => $lockedBooking->user_id,
                'method' => $method,
                'provider' => $payment->provider,
                'expires_at' => $payment->expires_at?->toISOString(),
            ]);

            return $payment->fresh(['booking.slot']);
        });
    }

    public function getPaymentDetailForUser(string $reference, User $user): Payment
    {
        $payment = Payment::query()
            ->with(['booking.slot', 'booking.user'])
            ->where('reference', $reference)
            ->firstOrFail();

        if ($payment->user_id !== $user->id && $user->role !== 'ADMIN') {
            throw new AuthorizationException('Anda tidak memiliki akses ke pembayaran ini.');
        }

        return $payment;
    }
}
