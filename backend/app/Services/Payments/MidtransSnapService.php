<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MidtransSnapService
{
    /**
     * @return array{token: string, redirect_url: string}
     */
    public function createTransaction(Payment $payment, Booking $booking, User $user): array
    {
        $serverKey = $this->getServerKey();
        $response = Http::withBasicAuth($serverKey, '')
            ->acceptJson()
            ->asJson()
            ->timeout(15)
            ->post($this->getSnapBaseUrl().'/snap/v1/transactions', $this->buildPayload($payment, $booking, $user))
            ->throw()
            ->json();

        if (
            ! is_array($response) ||
            ! isset($response['token'], $response['redirect_url']) ||
            ! is_string($response['token']) ||
            ! is_string($response['redirect_url'])
        ) {
            throw ValidationException::withMessages([
                'payment' => 'Midtrans tidak mengembalikan token checkout yang valid.',
            ]);
        }

        return [
            'token' => $response['token'],
            'redirect_url' => $response['redirect_url'],
        ];
    }

    public function verifyNotificationSignature(array $payload): bool
    {
        if (
            ! isset($payload['order_id'], $payload['status_code'], $payload['gross_amount'], $payload['signature_key']) ||
            ! is_string($payload['order_id']) ||
            ! is_string($payload['status_code']) ||
            ! is_string($payload['gross_amount']) ||
            ! is_string($payload['signature_key'])
        ) {
            return false;
        }

        $computedSignature = hash(
            'sha512',
            $payload['order_id'].$payload['status_code'].$payload['gross_amount'].$this->getServerKey(),
        );

        return hash_equals($computedSignature, $payload['signature_key']);
    }

    public function mapTransactionStatus(array $payload): string
    {
        $transactionStatus = strtolower((string) ($payload['transaction_status'] ?? ''));
        $fraudStatus = strtolower((string) ($payload['fraud_status'] ?? ''));

        if ($transactionStatus === 'capture') {
            return $fraudStatus === 'challenge' ? 'PENDING' : 'PAID';
        }

        return match ($transactionStatus) {
            'settlement' => 'PAID',
            'pending' => 'PENDING',
            'expire' => 'EXPIRED',
            'cancel' => 'CANCELLED',
            'deny', 'failure' => 'FAILED',
            default => 'PENDING',
        };
    }

    public function buildWebhookEventId(array $payload): string
    {
        $transactionId = (string) ($payload['transaction_id'] ?? 'unknown');
        $transactionStatus = (string) ($payload['transaction_status'] ?? 'unknown');
        $statusCode = (string) ($payload['status_code'] ?? 'unknown');

        return $transactionId.':'.$transactionStatus.':'.$statusCode;
    }

    public function expireTransaction(string $orderId): void
    {
        Http::withBasicAuth($this->getServerKey(), '')
            ->acceptJson()
            ->asJson()
            ->timeout(15)
            ->post($this->getApiBaseUrl().'/v2/'.$orderId.'/expire')
            ->throw();

        Log::info('payments.midtrans.expire_requested', [
            'order_id' => $orderId,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(Payment $payment, Booking $booking, User $user): array
    {
        $payload = [
            'transaction_details' => [
                'order_id' => $payment->reference,
                'gross_amount' => $payment->amount,
            ],
            'item_details' => [[
                'id' => 'slot-'.$booking->slot_id,
                'price' => $payment->amount,
                'quantity' => 1,
                'name' => 'Booking Lapak '.$booking->slot->slot_number,
                'category' => 'Fishing Slot',
                'merchant_name' => config('app.name'),
            ]],
            'customer_details' => [
                'first_name' => $user->name,
                'email' => $user->email,
            ],
            'callbacks' => [
                'finish' => rtrim((string) config('app.frontend_url'), '/').'/payments/'.$payment->reference.'?source=midtrans',
            ],
            'expiry' => [
                'start_time' => now()->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s O'),
                'unit' => 'minutes',
                'duration' => $this->resolveExpiryDurationInMinutes($booking),
            ],
            'custom_field1' => 'booking_id:'.$booking->id,
            'custom_field2' => 'slot_id:'.$booking->slot_id,
        ];

        $enabledPayments = config('services.midtrans.enabled_payments', []);

        if (is_array($enabledPayments) && $enabledPayments !== []) {
            $payload['enabled_payments'] = $enabledPayments;
        }

        return $payload;
    }

    private function resolveExpiryDurationInMinutes(Booking $booking): int
    {
        $secondsUntilExpiry = max(now()->diffInSeconds($booking->expires_at, false), 0);
        $duration = (int) ceil($secondsUntilExpiry / 60);

        return max($duration, 1);
    }

    private function getServerKey(): string
    {
        $serverKey = (string) config('services.midtrans.server_key');

        if ($serverKey === '') {
            throw ValidationException::withMessages([
                'payment' => 'Midtrans server key belum dikonfigurasi.',
            ]);
        }

        return $serverKey;
    }

    private function getSnapBaseUrl(): string
    {
        return (bool) config('services.midtrans.is_production')
            ? 'https://app.midtrans.com'
            : 'https://app.sandbox.midtrans.com';
    }

    private function getApiBaseUrl(): string
    {
        return (bool) config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
    }
}
