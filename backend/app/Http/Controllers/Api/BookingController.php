<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Slot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'slot_id' => 'required|exists:slots,id',
        ]);

        return DB::transaction(function () use ($request) {
            $slot = Slot::findOrFail($request->slot_id);

            if ($slot->status !== 'TERSEDIA') {
                return response()->json(['message' => 'Lapak tidak tersedia'], 400);
            }

            // 1. Buat data booking (Hardcode user_id: 1 dulu karena belum login)
            $booking = Booking::create([
                'user_id' => 1,
                'slot_id' => $slot->id,
                'booking_time' => now(),
                'status' => 'SUCCESS',
            ]);

            // 2. Ubah status lapak menjadi DIBOOKING
            $slot->update(['status' => 'DIBOOKING']);

            return response()->json([
                'success' => true,
                'message' => 'Booking berhasil!',
                'data' => $booking
            ]);
        });
    }
}
