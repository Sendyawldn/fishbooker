<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\FinancialJournal;
use App\Models\Payment;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_should_create_pending_payment_when_booking_belongs_to_authenticated_user(): void
    {
        $user = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        $slot = Slot::create([
            'slot_number' => 41,
            'status' => 'DIBOOKING',
            'price' => 85000,
        ]);

        $booking = Booking::create([
            'user_id' => $user->id,
            'slot_id' => $slot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/v1/bookings/{$booking->id}/payments", [
            'method' => 'MANUAL_TRANSFER',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.booking.id', $booking->id)
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.method', 'MANUAL_TRANSFER');

        $this->assertDatabaseHas('payments', [
            'booking_id' => $booking->id,
            'user_id' => $user->id,
            'status' => 'PENDING',
            'method' => 'MANUAL_TRANSFER',
        ]);
    }

    public function test_should_mark_payment_and_booking_as_paid_when_manual_webhook_signature_is_valid(): void
    {
        $user = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        $slot = Slot::create([
            'slot_number' => 42,
            'status' => 'DIBOOKING',
            'price' => 90000,
        ]);

        $booking = Booking::create([
            'user_id' => $user->id,
            'slot_id' => $slot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $user->id,
            'provider' => 'MANUAL',
            'method' => 'MANUAL_TRANSFER',
            'status' => 'PENDING',
            'amount' => 90000,
            'currency' => 'IDR',
            'reference' => (string) Str::uuid(),
            'gateway_reference' => (string) Str::uuid(),
            'checkout_url' => 'http://localhost:3000/payments/demo',
            'expires_at' => now()->addMinutes(15),
        ]);

        $payload = [
            'payment_reference' => $payment->reference,
            'status' => 'PAID',
            'event_type' => 'payment.settled',
            'event_time' => now()->toISOString(),
        ];

        $rawPayload = json_encode($payload, JSON_THROW_ON_ERROR);
        $signature = hash_hmac(
            'sha256',
            $rawPayload,
            (string) config('services.manual_payment.webhook_secret'),
        );

        $response = $this->withHeaders([
            'X-Fishbooker-Event-Id' => 'evt-123',
            'X-Fishbooker-Signature' => $signature,
        ])->postJson('/api/v1/payments/webhooks/manual', $payload);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reference', $payment->reference)
            ->assertJsonPath('data.status', 'PAID');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'PAID',
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'SUCCESS',
        ]);

        $this->assertDatabaseHas('financial_journals', [
            'payment_id' => $payment->id,
            'entry_type' => 'PAYMENT_CAPTURED',
            'amount' => 90000,
        ]);
    }

    public function test_should_confirm_pending_cash_payment_from_admin_dashboard(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $customer = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        $slot = Slot::create([
            'slot_number' => 43,
            'status' => 'DIBOOKING',
            'price' => 76000,
        ]);

        $booking = Booking::create([
            'user_id' => $customer->id,
            'slot_id' => $slot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $customer->id,
            'provider' => 'MANUAL',
            'method' => 'CASH',
            'status' => 'PENDING',
            'amount' => 76000,
            'currency' => 'IDR',
            'reference' => (string) Str::uuid(),
            'gateway_reference' => (string) Str::uuid(),
            'checkout_url' => 'http://localhost:3000/payments/demo-cash',
            'expires_at' => now()->addMinutes(15),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/admin/payments/{$payment->id}/confirm-cash", [
            'note' => 'Pembayaran diterima di kasir.',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.reference', $payment->reference)
            ->assertJsonPath('data.status', 'PAID');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'PAID',
        ]);

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'SUCCESS',
        ]);
    }

    public function test_should_return_admin_dashboard_metrics_when_admin_requests_reporting_data(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $customer = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        $paidSlot = Slot::create([
            'slot_number' => 44,
            'status' => 'DIBOOKING',
            'price' => 100000,
        ]);

        Slot::create([
            'slot_number' => 45,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $booking = Booking::create([
            'user_id' => $customer->id,
            'slot_id' => $paidSlot->id,
            'booking_time' => now()->subHour(),
            'expires_at' => null,
            'paid_at' => now()->subMinutes(30),
            'status' => 'SUCCESS',
        ]);

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'user_id' => $customer->id,
            'provider' => 'MANUAL',
            'method' => 'MANUAL_TRANSFER',
            'status' => 'PAID',
            'amount' => 100000,
            'currency' => 'IDR',
            'reference' => (string) Str::uuid(),
            'gateway_reference' => (string) Str::uuid(),
            'checkout_url' => 'http://localhost:3000/payments/dashboard-demo',
            'expires_at' => null,
            'paid_at' => now()->subMinutes(30),
        ]);

        FinancialJournal::create([
            'booking_id' => $booking->id,
            'payment_id' => $payment->id,
            'entry_type' => 'PAYMENT_CAPTURED',
            'amount' => 100000,
            'currency' => 'IDR',
            'description' => 'Pembayaran berhasil dicatat.',
            'recorded_at' => now()->subMinutes(30),
            'metadata' => [
                'provider' => 'MANUAL',
            ],
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.metrics.gross_revenue_today', 100000)
            ->assertJsonPath('data.metrics.paid_today', 1)
            ->assertJsonPath('data.recent_transactions.0.reference', $payment->reference);
    }
}
