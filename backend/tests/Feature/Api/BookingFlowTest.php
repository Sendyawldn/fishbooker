<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
use App\Models\OperationalSetting;
use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_pending_booking_with_hold_expiry(): void
    {
        $user = User::factory()->create();
        $slot = Slot::create([
            'slot_number' => 21,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/bookings', [
            'slot_id' => $slot->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.slot_id', $slot->id)
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.status', 'PENDING');

        $this->assertDatabaseHas('bookings', [
            'user_id' => $user->id,
            'slot_id' => $slot->id,
            'status' => 'PENDING',
        ]);

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'DIBOOKING',
        ]);
    }

    public function test_second_user_cannot_book_slot_when_hold_is_active(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $slot = Slot::create([
            'slot_number' => 22,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        Booking::create([
            'user_id' => $firstUser->id,
            'slot_id' => $slot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        $slot->update(['status' => 'DIBOOKING']);

        Sanctum::actingAs($secondUser);

        $response = $this->postJson('/api/v1/bookings', [
            'slot_id' => $slot->id,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('error', 'SLOT_LOCKED');
    }

    public function test_expired_hold_is_released_and_new_booking_can_be_created(): void
    {
        $firstUser = User::factory()->create();
        $secondUser = User::factory()->create();
        $slot = Slot::create([
            'slot_number' => 23,
            'status' => 'DIBOOKING',
            'price' => 50000,
        ]);

        $oldBooking = Booking::create([
            'user_id' => $firstUser->id,
            'slot_id' => $slot->id,
            'booking_time' => now()->subMinutes(20),
            'expires_at' => now()->subMinutes(5),
            'status' => 'PENDING',
        ]);

        Sanctum::actingAs($secondUser);

        $response = $this->postJson('/api/v1/bookings', [
            'slot_id' => $slot->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user_id', $secondUser->id)
            ->assertJsonPath('data.status', 'PENDING');

        $this->assertDatabaseHas('bookings', [
            'id' => $oldBooking->id,
            'status' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'DIBOOKING',
        ]);
    }

    public function test_authenticated_user_can_view_own_booking_history_with_slot_details(): void
    {
        $user = User::factory()->create();
        $anotherUser = User::factory()->create();

        $firstSlot = Slot::create([
            'slot_number' => 24,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $secondSlot = Slot::create([
            'slot_number' => 25,
            'status' => 'DIBOOKING',
            'price' => 65000,
        ]);

        Booking::create([
            'user_id' => $user->id,
            'slot_id' => $firstSlot->id,
            'booking_time' => now()->subDay(),
            'expires_at' => now()->subHours(23),
            'status' => 'SUCCESS',
        ]);

        Booking::create([
            'user_id' => $user->id,
            'slot_id' => $secondSlot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        Booking::create([
            'user_id' => $anotherUser->id,
            'slot_id' => $firstSlot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/bookings/me');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.slot.slot_number', 25)
            ->assertJsonPath('data.1.slot.slot_number', 24);
    }

    public function test_booking_history_cancels_expired_pending_bookings_for_the_current_user(): void
    {
        $user = User::factory()->create();
        $slot = Slot::create([
            'slot_number' => 26,
            'status' => 'DIBOOKING',
            'price' => 70000,
        ]);

        $expiredBooking = Booking::create([
            'user_id' => $user->id,
            'slot_id' => $slot->id,
            'booking_time' => now()->subMinutes(30),
            'expires_at' => now()->subMinutes(10),
            'status' => 'PENDING',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/bookings/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $expiredBooking->id)
            ->assertJsonPath('data.0.status', 'CANCELLED');

        $this->assertDatabaseHas('bookings', [
            'id' => $expiredBooking->id,
            'status' => 'CANCELLED',
        ]);

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'status' => 'TERSEDIA',
        ]);
    }

    public function test_booking_creation_is_blocked_when_kill_switch_is_enabled(): void
    {
        $user = User::factory()->create();
        $slot = Slot::create([
            'slot_number' => 27,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        OperationalSetting::create([
            'key' => 'bookings_enabled',
            'value' => '0',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/bookings', [
            'slot_id' => $slot->id,
        ])
            ->assertStatus(503)
            ->assertJsonPath('error', 'BOOKING_DISABLED');
    }

    public function test_blocked_customer_cannot_create_booking(): void
    {
        $user = User::factory()->create([
            'is_booking_blocked' => true,
            'booking_block_reason' => 'Blacklist operasional.',
        ]);
        $slot = Slot::create([
            'slot_number' => 28,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/bookings', [
            'slot_id' => $slot->id,
        ])
            ->assertForbidden()
            ->assertJsonPath('error', 'BOOKING_BLOCKED')
            ->assertJsonPath('message', 'Blacklist operasional.');
    }

    public function test_customer_cannot_exceed_active_pending_booking_limit(): void
    {
        $user = User::factory()->create();

        OperationalSetting::create([
            'key' => 'max_active_holds_per_user',
            'value' => '1',
        ]);

        $firstSlot = Slot::create([
            'slot_number' => 29,
            'status' => 'DIBOOKING',
            'price' => 50000,
        ]);
        $secondSlot = Slot::create([
            'slot_number' => 30,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        Booking::create([
            'user_id' => $user->id,
            'slot_id' => $firstSlot->id,
            'booking_time' => now(),
            'expires_at' => now()->addMinutes(15),
            'status' => 'PENDING',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/bookings', [
            'slot_id' => $secondSlot->id,
        ])
            ->assertStatus(422)
            ->assertJsonPath('error', 'BOOKING_LIMIT_REACHED')
            ->assertJsonPath('active_pending_bookings', 1)
            ->assertJsonPath('max_active_holds_per_user', 1);
    }
}
