<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Bookings\BookingAccessControlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminBookingControlsController extends Controller
{
    public function show(BookingAccessControlService $bookingAccessControlService): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Kontrol booking operasional berhasil diambil.',
            'data' => $bookingAccessControlService->getControls(),
        ]);
    }

    public function update(
        Request $request,
        BookingAccessControlService $bookingAccessControlService,
    ): JsonResponse {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $validated = $request->validate([
            'bookings_enabled' => ['sometimes', 'boolean'],
            'max_active_holds_per_user' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);

        $controls = $bookingAccessControlService->updateControls($validated, $user);

        return response()->json([
            'success' => true,
            'message' => 'Kontrol booking operasional berhasil diperbarui.',
            'data' => $controls,
        ]);
    }

    public function customers(
        Request $request,
        BookingAccessControlService $bookingAccessControlService,
    ): JsonResponse {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $customers = $bookingAccessControlService->paginateCustomers($validated);

        return response()->json([
            'success' => true,
            'message' => 'Daftar pelanggan untuk booking controls berhasil diambil.',
            'data' => $customers->items(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function updateCustomerAccess(
        Request $request,
        User $user,
        BookingAccessControlService $bookingAccessControlService,
    ): JsonResponse {
        if ($user->role !== 'PELANGGAN') {
            throw ValidationException::withMessages([
                'user' => 'Hanya pelanggan yang bisa diubah booking access-nya.',
            ]);
        }

        $validated = $request->validate([
            'is_booking_blocked' => ['required', 'boolean'],
            'booking_block_reason' => [
                'nullable',
                'string',
                'max:255',
                Rule::requiredIf((bool) $request->boolean('is_booking_blocked')),
            ],
        ]);

        $updatedUser = $bookingAccessControlService->updateCustomerAccess($user, $validated);

        return response()->json([
            'success' => true,
            'message' => $updatedUser->is_booking_blocked
                ? 'Pelanggan berhasil diblokir dari booking baru.'
                : 'Akses booking pelanggan berhasil dipulihkan.',
            'data' => $updatedUser,
        ]);
    }
}
