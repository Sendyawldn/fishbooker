<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreSlotRequest;
use App\Http\Requests\Api\UpdateSlotRequest;
use App\Models\Slot;
use Illuminate\Http\JsonResponse;

class SlotController extends Controller
{
    public function store(StoreSlotRequest $request): JsonResponse
    {
        $slot = Slot::create([
            'slot_number' => $request->integer('slot_number'),
            'price' => $request->integer('price'),
            'status' => $request->input('status', 'TERSEDIA'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lapak berhasil dibuat',
            'data' => $slot,
        ], 201);
    }

    public function index(): JsonResponse
    {
        // Mengambil semua data slot/lapak dari database
        $slots = Slot::all();

        return response()->json([
            'success' => true,
            'message' => 'Daftar lapak berhasil diambil',
            'data'    => $slots
        ]);
    }

    public function update(UpdateSlotRequest $request, Slot $slot): JsonResponse
    {
        $slot->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Lapak berhasil diperbarui',
            'data' => $slot->fresh(),
        ]);
    }

    public function destroy(Slot $slot): JsonResponse
    {
        $slot->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lapak berhasil dihapus',
        ]);
    }
}
