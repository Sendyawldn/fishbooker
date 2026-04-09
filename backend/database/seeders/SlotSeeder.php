<?php

namespace Database\Seeders;

use App\Models\Slot;
use Illuminate\Database\Seeder;

class SlotSeeder extends Seeder
{
    public function run(): void
    {
        $slots = [
            ['slot_number' => 1, 'status' => 'TERSEDIA', 'price' => 50000],
            ['slot_number' => 2, 'status' => 'DIBOOKING', 'price' => 50000],
            ['slot_number' => 3, 'status' => 'TERSEDIA', 'price' => 75000],
            ['slot_number' => 4, 'status' => 'PERBAIKAN', 'price' => 50000],
            ['slot_number' => 5, 'status' => 'TERSEDIA', 'price' => 50000],
        ];

        foreach ($slots as $slot) {
            Slot::create($slot);
        }
    }
}
