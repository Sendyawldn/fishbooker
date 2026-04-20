<?php

namespace Tests\Feature\Api;

use App\Models\Slot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSlotManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_slot(): void
    {
        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/admin/slots', [
            'slot_number' => 11,
            'price' => 55000,
            'status' => 'TERSEDIA',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.slot_number', 11)
            ->assertJsonPath('data.price', 55000);

        $this->assertDatabaseHas('slots', [
            'slot_number' => 11,
            'price' => 55000,
            'status' => 'TERSEDIA',
        ]);
    }

    public function test_non_admin_user_cannot_update_slot(): void
    {
        $slot = Slot::create([
            'slot_number' => 7,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $customer = User::factory()->create([
            'role' => 'PELANGGAN',
        ]);

        Sanctum::actingAs($customer);

        $response = $this->patchJson("/api/v1/admin/slots/{$slot->id}", [
            'price' => 60000,
        ]);

        $response
            ->assertStatus(403)
            ->assertJson([
                'message' => 'Akses ditolak. Hanya admin yang dapat melakukan aksi ini.',
            ]);
    }

    public function test_admin_can_update_slot_price_and_status(): void
    {
        $slot = Slot::create([
            'slot_number' => 8,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/v1/admin/slots/{$slot->id}", [
            'price' => 75000,
            'status' => 'PERBAIKAN',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.price', 75000)
            ->assertJsonPath('data.status', 'PERBAIKAN');

        $this->assertDatabaseHas('slots', [
            'id' => $slot->id,
            'price' => 75000,
            'status' => 'PERBAIKAN',
        ]);
    }

    public function test_admin_update_requires_price_or_status_field(): void
    {
        $slot = Slot::create([
            'slot_number' => 9,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson("/api/v1/admin/slots/{$slot->id}", []);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors('payload');
    }

    public function test_admin_can_delete_slot(): void
    {
        $slot = Slot::create([
            'slot_number' => 10,
            'status' => 'TERSEDIA',
            'price' => 50000,
        ]);

        $admin = User::factory()->create([
            'role' => 'ADMIN',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->deleteJson("/api/v1/admin/slots/{$slot->id}");

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('slots', [
            'id' => $slot->id,
        ]);
    }
}
