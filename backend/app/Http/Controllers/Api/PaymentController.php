<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\Payments\PaymentService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function store(Request $request, Booking $booking, PaymentService $paymentService): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $validated = $request->validate([
            'method' => ['nullable', 'in:MANUAL_TRANSFER,CASH'],
        ]);

        try {
            $payment = $paymentService->createOrReusePayment(
                $booking,
                $user,
                $validated['method'] ?? 'MANUAL_TRANSFER',
            );
        } catch (AuthorizationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 403);
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $exception->errors(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Instruksi pembayaran berhasil disiapkan.',
            'data' => $this->transformPayment($payment),
        ]);
    }

    public function show(Request $request, string $reference, PaymentService $paymentService): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        try {
            $payment = $paymentService->getPaymentDetailForUser($reference, $user);
        } catch (AuthorizationException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail pembayaran berhasil diambil.',
            'data' => $this->transformPayment($payment),
        ]);
    }

    private function transformPayment(\App\Models\Payment $payment): array
    {
        return [
            'reference' => $payment->reference,
            'provider' => $payment->provider,
            'method' => $payment->method,
            'status' => $payment->status,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
            'checkout_url' => $payment->checkout_url,
            'expires_at' => $payment->expires_at?->toISOString(),
            'paid_at' => $payment->paid_at?->toISOString(),
            'booking' => [
                'id' => $payment->booking->id,
                'status' => $payment->booking->status,
                'booking_time' => $payment->booking->booking_time?->toISOString(),
                'expires_at' => $payment->booking->expires_at?->toISOString(),
                'paid_at' => $payment->booking->paid_at?->toISOString(),
                'slot' => [
                    'id' => $payment->booking->slot->id,
                    'slot_number' => $payment->booking->slot->slot_number,
                    'status' => $payment->booking->slot->status,
                    'price' => $payment->booking->slot->price,
                ],
            ],
        ];
    }
}
