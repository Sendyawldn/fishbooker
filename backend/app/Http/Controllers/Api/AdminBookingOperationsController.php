<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Bookings\AdminBookingOperationsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AdminBookingOperationsController extends Controller
{
    public function index(Request $request, AdminBookingOperationsService $adminBookingOperationsService): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['nullable', 'in:ALL,PENDING,SUCCESS,CANCELLED'],
            'payment_status' => ['nullable', 'in:ALL,NONE,PENDING,PAID,FAILED,EXPIRED,CANCELLED'],
            'customer_access' => ['nullable', 'in:ALL,ACTIVE,BLOCKED'],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $bookings = $adminBookingOperationsService->paginateBookings($validated);

        return response()->json([
            'success' => true,
            'message' => 'Daftar booking admin berhasil diambil.',
            'data' => $bookings->items(),
            'meta' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ]);
    }

    public function cancel(
        Request $request,
        Booking $booking,
        AdminBookingOperationsService $adminBookingOperationsService,
    ): JsonResponse {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $cancelledBooking = $adminBookingOperationsService->cancelPendingBooking(
                $booking,
                $user,
                $validated['note'] ?? null,
            );
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Booking pending berhasil dibatalkan oleh admin.',
            'data' => $cancelledBooking,
        ]);
    }
}
