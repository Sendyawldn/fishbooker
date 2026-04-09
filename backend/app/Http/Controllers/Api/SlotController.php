<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Slot;
use Illuminate\Http\JsonResponse;

class SlotController extends Controller
{
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
}
