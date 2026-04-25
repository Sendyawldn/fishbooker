<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminBookingOperationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_should_return_paginated_admin_booking_list_with_filters(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $customer = User::factory()->create([
            'name' => 'Budi Operator',
            'email' => 'budi@example.com',
            'role' => 'PELANGGAN',
        ]);

        $pendingSlot = Slot::create([
            'slot_number' => 71,
            'status' => 'DIBOOKING',
            'price' => 88000,
        ]);

        $successSlot = Slot::create([
            'slot_number' => 72,
            'status' => 'DIBOOKING',
            'price' => 91000,
        ]);

        Booking::create([
            'user_id' => $customer->id,
            'slot_id' => $pendingSlot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        $successBooking = Booking::create([
            'user_id' => $customer->id,
            'slot_id' => $successSlot->id,
            'booking_time' => now()->subHour(),
            'expires_at' => null,
            'paid_at' => now()->subMinutes(30),
            'status' => 'SUCCESS',
        ]);

        Payment::create([
            'booking_id' => $successBooking->id,
            'user_id' => $customer->id,
            'provider' => 'MIDTRANS',
            'method' => 'MIDTRANS_SNAP',
            'status' => 'PAID',
            'amount' => 91000,
            'currency' => 'IDR',
            'reference' => 'filter-paid-reference',
            'gateway_reference' => 'filter-paid-gateway-reference',
            'checkout_url' => null,
            'expires_at' => null,
            'paid_at' => now()->subMinutes(30),
        ]);

        $blockedCustomer = User::factory()->create([
            'name' => 'Diblokir',
            'email' => 'blocked@example.com',
            'role' => 'PELANGGAN',
            'is_booking_blocked' => true,
            'booking_block_reason' => 'Spam booking.',
        ]);

        $blockedSlot = Slot::create([
            'slot_number' => 73,
            'status' => 'DIBOOKING',
            'price' => 99000,
        ]);

        $blockedBooking = Booking::create([
            'user_id' => $blockedCustomer->id,
            'slot_id' => $blockedSlot->id,
            'booking_time' => now()->subMinutes(30),
            'expires_at' => now()->addMinutes(10),
            'status' => 'PENDING',
        ]);

        Payment::create([
            'booking_id' => $blockedBooking->id,
            'user_id' => $blockedCustomer->id,
            'provider' => 'MIDTRANS',
            'method' => 'MIDTRANS_SNAP',
            'status' => 'PENDING',
            'amount' => 99000,
            'currency' => 'IDR',
            'reference' => 'filter-pending-reference',
            'gateway_reference' => 'filter-pending-gateway-reference',
            'checkout_url' => 'https://example.test/blocked-checkout',
            'expires_at' => now()->addMinutes(10),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/admin/bookings?payment_status=PAID&customer_access=ACTIVE&search=Budi');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.status', 'SUCCESS')
            ->assertJsonPath('data.0.user.name', 'Budi Operator')
            ->assertJsonPath('data.0.user.is_booking_blocked', false)
            ->assertJsonPath('data.0.latest_payment.status', 'PAID');

        $blockedResponse = $this->getJson('/api/v1/admin/bookings?status=PENDING&payment_status=PENDING&customer_access=BLOCKED');

        $blockedResponse
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.user.name', 'Diblokir')
            ->assertJsonPath('data.0.user.is_booking_blocked', true)
            ->assertJsonPath('data.0.latest_payment.status', 'PENDING');
    }

    public function test_should_cancel_pending_booking_and_expire_midtrans_payment_when_admin_requests_it(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        $customer = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        $slot = Slot::create([
            'slot_number' => 73,
            'status' => 'DIBOOKING',
            'price' => 93000,
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
            'provider' => 'MIDTRANS',
            'method' => 'MIDTRANS_SNAP',
            'status' => 'PENDING',
            'amount' => 93000,
            'currency' => 'IDR',
            'reference' => 'demo-midtrans-order',
            'gateway_reference' => 'demo-midtrans-token',
            'checkout_url' => 'https://app.sandbox.midtrans.com/snap/demo-order',
            'expires_at' => now()->addMinutes(15),
        ]);

        config()->set('services.midtrans.server_key', 'SB-Mid-server-demo');
        config()->set('services.midtrans.is_production', false);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/demo-midtrans-order/expire' => Http::response([
                'status_code' => '407',
                'status_message' => 'Success, transaction has expired',
            ]),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson("/api/v1/admin/bookings/{$booking->id}/cancel", [
            'note' => 'Hold dibatalkan admin.',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'CANCELLED');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'TERSEDIA',
        ]);
    }
}
