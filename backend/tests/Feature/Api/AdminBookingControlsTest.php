<?php

namespace Tests\Feature\Api;

use App\Models\OperationalSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminBookingControlsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_and_update_booking_controls(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/v1/admin/operations/booking-controls')
            ->assertOk()
            ->assertJsonPath('data.bookings_enabled', true)
            ->assertJsonPath('data.max_active_holds_per_user', 2);

        $this->patchJson('/api/v1/admin/operations/booking-controls', [
            'bookings_enabled' => false,
            'max_active_holds_per_user' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('data.bookings_enabled', false)
            ->assertJsonPath('data.max_active_holds_per_user', 1);

        $this->assertDatabaseHas('operational_settings', [
            'key' => 'bookings_enabled',
            'value' => '0',
        ]);

        $this->assertDatabaseHas('operational_settings', [
            'key' => 'max_active_holds_per_user',
            'value' => '1',
        ]);
    }

    public function test_admin_can_block_and_restore_customer_booking_access(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);
        $customer = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/v1/admin/customers/{$customer->id}/booking-access", [
            'is_booking_blocked' => true,
            'booking_block_reason' => 'Sering booking tanpa bayar.',
        ])
            ->assertOk()
            ->assertJsonPath('data.is_booking_blocked', true)
            ->assertJsonPath('data.booking_block_reason', 'Sering booking tanpa bayar.');

        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'is_booking_blocked' => true,
            'booking_block_reason' => 'Sering booking tanpa bayar.',
        ]);

        $this->patchJson("/api/v1/admin/customers/{$customer->id}/booking-access", [
            'is_booking_blocked' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_booking_blocked', false)
            ->assertJsonPath('data.booking_block_reason', null);

        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'is_booking_blocked' => false,
            'booking_block_reason' => null,
        ]);
    }
}
