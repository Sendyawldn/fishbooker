<?php

namespace App\Services\Payments;

use App\Models\FinancialJournal;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\User;
use App\Services\Bookings\BookingLifecycleService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PaymentWebhookService
{
    public function __construct(
        private readonly BookingLifecycleService $bookingLifecycleService,
        private readonly MidtransSnapService $midtransSnapService,
    ) {
    }

    public function verifyManualWebhookSignature(string $rawPayload, ?string $signature): bool
    {
        $secret = (string) config('services.manual_payment.webhook_secret');

        if ($secret === '' || $signature === null || $signature === '') {
            return false;
        }

        $computedSignature = hash_hmac('sha256', $rawPayload, $secret);

        return hash_equals($computedSignature, $signature);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{processed: bool, duplicate: bool, payment: Payment}
     */
    public function processManualWebhook(array $payload, string $eventId, ?string $signature): array
    {
        $paymentReference = (string) $payload['payment_reference'];
        $paymentStatus = (string) $payload['status'];
        $eventType = (string) ($payload['event_type'] ?? 'payment.status_changed');
        $eventTime = isset($payload['event_time']) && is_string($payload['event_time'])
            ? Carbon::parse($payload['event_time'])
            : now();

        return DB::transaction(function () use ($eventId, $eventTime, $eventType, $paymentReference, $paymentStatus, $payload, $signature): array {
            $existingEvent = PaymentWebhookEvent::query()
                ->where('provider', (string) config('services.manual_payment.provider', 'MANUAL'))
                ->where('event_id', $eventId)
                ->first();

            if ($existingEvent) {
                $payment = $existingEvent->payment ?? Payment::query()
                    ->with(['booking.slot', 'booking.user'])
                    ->where('reference', $paymentReference)
                    ->firstOrFail();

                Log::info('payments.manual_webhook.duplicate', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'payment_status' => $payment->status,
                ]);

                return [
                    'processed' => true,
                    'duplicate' => true,
                    'payment' => $payment,
                ];
            }

            $payment = Payment::query()
                ->with(['booking.slot', 'booking.user'])
                ->where('reference', $paymentReference)
                ->lockForUpdate()
                ->firstOrFail();

            $webhookEvent = PaymentWebhookEvent::create([
                'payment_id' => $payment->id,
                'provider' => (string) config('services.manual_payment.provider', 'MANUAL'),
                'event_id' => $eventId,
                'event_type' => $eventType,
                'signature_hash' => $signature ? hash('sha256', $signature) : null,
                'payload' => $payload,
                'processed_at' => $eventTime,
            ]);

            if ($paymentStatus === 'PAID') {
                $payment->forceFill([
                    'status' => 'PAID',
                    'paid_at' => $eventTime,
                    'expires_at' => null,
                ])->save();

                $this->bookingLifecycleService->markBookingPaid($payment->booking, $eventTime);

                FinancialJournal::query()->firstOrCreate(
                    [
                        'payment_id' => $payment->id,
                        'entry_type' => 'PAYMENT_CAPTURED',
                    ],
                    [
                        'booking_id' => $payment->booking_id,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'description' => sprintf(
                            'Pembayaran booking lapak %s tercatat.',
                            $payment->booking->slot->slot_number,
                        ),
                        'recorded_at' => $eventTime,
                        'metadata' => [
                            'provider' => $payment->provider,
                            'method' => $payment->method,
                            'webhook_event_id' => $webhookEvent->id,
                        ],
                    ],
                );

                Log::info('payments.manual_webhook.settled', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'booking_id' => $payment->booking_id,
                    'method' => $payment->method,
                    'provider' => $payment->provider,
                    'paid_at' => $eventTime->toISOString(),
                ]);
            }

            if (in_array($paymentStatus, ['FAILED', 'EXPIRED', 'CANCELLED'], true)) {
                $payment->forceFill([
                    'status' => $paymentStatus,
                ])->save();

                $this->bookingLifecycleService->cancelBooking($payment->booking);

                Log::warning('payments.manual_webhook.payment_closed_without_success', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'booking_id' => $payment->booking_id,
                    'payment_status' => $paymentStatus,
                ]);
            }

            return [
                'processed' => true,
                'duplicate' => false,
                'payment' => $payment->fresh(['booking.slot', 'booking.user']),
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{processed: bool, duplicate: bool, payment: Payment}
     */
    public function processMidtransWebhook(array $payload): array
    {
        $paymentReference = (string) $payload['order_id'];
        $paymentStatus = $this->midtransSnapService->mapTransactionStatus($payload);
        $eventId = $this->midtransSnapService->buildWebhookEventId($payload);
        $eventType = 'payment.midtrans.'.strtolower((string) ($payload['transaction_status'] ?? 'unknown'));
        $eventTime = isset($payload['settlement_time']) && is_string($payload['settlement_time'])
            ? Carbon::parse($payload['settlement_time'])
            : (isset($payload['transaction_time']) && is_string($payload['transaction_time'])
                ? Carbon::parse($payload['transaction_time'])
                : now());
        $signature = isset($payload['signature_key']) && is_string($payload['signature_key'])
            ? $payload['signature_key']
            : null;

        return DB::transaction(function () use ($eventId, $eventTime, $eventType, $paymentReference, $paymentStatus, $payload, $signature): array {
            $existingEvent = PaymentWebhookEvent::query()
                ->where('provider', (string) config('services.midtrans.provider', 'MIDTRANS'))
                ->where('event_id', $eventId)
                ->first();

            if ($existingEvent) {
                $payment = $existingEvent->payment ?? Payment::query()
                    ->with(['booking.slot', 'booking.user'])
                    ->where('reference', $paymentReference)
                    ->firstOrFail();

                Log::info('payments.midtrans_webhook.duplicate', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'payment_status' => $payment->status,
                ]);

                return [
                    'processed' => true,
                    'duplicate' => true,
                    'payment' => $payment,
                ];
            }

            $payment = Payment::query()
                ->with(['booking.slot', 'booking.user'])
                ->where('reference', $paymentReference)
                ->lockForUpdate()
                ->firstOrFail();

            $webhookEvent = PaymentWebhookEvent::create([
                'payment_id' => $payment->id,
                'provider' => (string) config('services.midtrans.provider', 'MIDTRANS'),
                'event_id' => $eventId,
                'event_type' => $eventType,
                'signature_hash' => $signature ? hash('sha256', $signature) : null,
                'payload' => $payload,
                'processed_at' => $eventTime,
            ]);

            $payment->forceFill([
                'gateway_reference' => isset($payload['transaction_id']) && is_string($payload['transaction_id'])
                    ? $payload['transaction_id']
                    : $payment->gateway_reference,
                'metadata' => array_merge($payment->metadata ?? [], [
                    'payment_type' => $payload['payment_type'] ?? null,
                    'midtrans_transaction_status' => $payload['transaction_status'] ?? null,
                    'midtrans_status_code' => $payload['status_code'] ?? null,
                    'midtrans_webhook_event_id' => $webhookEvent->id,
                ]),
            ])->save();

            if ($paymentStatus === 'PAID') {
                $payment->forceFill([
                    'status' => 'PAID',
                    'paid_at' => $eventTime,
                    'expires_at' => null,
                ])->save();

                $this->bookingLifecycleService->markBookingPaid($payment->booking, $eventTime);

                FinancialJournal::query()->firstOrCreate(
                    [
                        'payment_id' => $payment->id,
                        'entry_type' => 'PAYMENT_CAPTURED',
                    ],
                    [
                        'booking_id' => $payment->booking_id,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'description' => sprintf(
                            'Pembayaran Midtrans booking lapak %s tercatat.',
                            $payment->booking->slot->slot_number,
                        ),
                        'recorded_at' => $eventTime,
                        'metadata' => [
                            'provider' => $payment->provider,
                            'method' => $payment->method,
                            'webhook_event_id' => $webhookEvent->id,
                        ],
                    ],
                );

                Log::info('payments.midtrans_webhook.settled', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'booking_id' => $payment->booking_id,
                    'payment_type' => $payload['payment_type'] ?? null,
                    'paid_at' => $eventTime->toISOString(),
                ]);
            }

            if (in_array($paymentStatus, ['FAILED', 'EXPIRED', 'CANCELLED'], true)) {
                $payment->forceFill([
                    'status' => $paymentStatus,
                    'expires_at' => null,
                ])->save();

                $this->bookingLifecycleService->cancelBooking($payment->booking);

                Log::warning('payments.midtrans_webhook.payment_closed_without_success', [
                    'event_id' => $eventId,
                    'payment_id' => $payment->id,
                    'payment_reference' => $paymentReference,
                    'booking_id' => $payment->booking_id,
                    'payment_status' => $paymentStatus,
                ]);
            }

            return [
                'processed' => true,
                'duplicate' => false,
                'payment' => $payment->fresh(['booking.slot', 'booking.user']),
            ];
        });
    }

    public function confirmCashPayment(Payment $payment, User $adminUser, ?string $note = null): Payment
    {
        if ($adminUser->role !== 'ADMIN') {
            throw ValidationException::withMessages([
                'payment' => 'Hanya admin yang bisa mengonfirmasi pembayaran tunai.',
            ]);
        }

        if ($payment->status === 'PAID') {
            return $payment->fresh(['booking.slot', 'booking.user']);
        }

        if ($payment->method !== 'CASH') {
            throw ValidationException::withMessages([
                'payment' => 'Hanya pembayaran dengan metode CASH yang bisa dikonfirmasi manual.',
            ]);
        }

        if ($payment->status !== 'PENDING') {
            throw ValidationException::withMessages([
                'payment' => 'Pembayaran ini sudah tidak berada pada status menunggu.',
            ]);
        }

        $payload = [
            'payment_reference' => $payment->reference,
            'status' => 'PAID',
            'event_type' => 'payment.cash_confirmed',
            'event_time' => now()->toISOString(),
            'metadata' => [
                'confirmed_by_admin_id' => $adminUser->id,
                'note' => $note,
            ],
        ];

        $eventId = 'cash-confirm-'.Str::uuid();

        Log::info('payments.cash_confirmation.requested', [
            'event_id' => $eventId,
            'payment_id' => $payment->id,
            'payment_reference' => $payment->reference,
            'booking_id' => $payment->booking_id,
            'admin_user_id' => $adminUser->id,
        ]);

        return $this->processManualWebhook($payload, $eventId, null)['payment'];
    }

    public function expirePendingExternalPayment(Payment $payment): void
    {
        if ($payment->status !== 'PENDING') {
            return;
        }

        if ($payment->provider === (string) config('services.midtrans.provider', 'MIDTRANS')) {
            $this->midtransSnapService->expireTransaction($payment->reference);
        }
    }
}
