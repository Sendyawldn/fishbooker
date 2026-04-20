<?php

namespace Tests\Feature\Api;

use App\Models\Booking;
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
}
