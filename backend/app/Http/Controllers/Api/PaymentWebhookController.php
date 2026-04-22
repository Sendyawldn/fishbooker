<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\PaymentWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentWebhookController extends Controller
{
    public function manual(Request $request, PaymentWebhookService $paymentWebhookService): JsonResponse
    {
        $signature = $request->header('X-Fishbooker-Signature');
        $eventId = $request->header('X-Fishbooker-Event-Id');
        $rawPayload = $request->getContent();

        if (! $paymentWebhookService->verifyManualWebhookSignature($rawPayload, $signature)) {
            return response()->json([
                'message' => 'Webhook signature tidak valid.',
            ], 401);
        }

        $validated = $request->validate([
            'payment_reference' => ['required', 'uuid'],
            'status' => ['required', 'in:PAID,FAILED,EXPIRED,CANCELLED'],
            'event_type' => ['nullable', 'string', 'max:64'],
            'event_time' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (! is_string($eventId) || $eventId === '') {
            return response()->json([
                'message' => 'Webhook event id wajib dikirim.',
            ], 422);
        }

        $result = $paymentWebhookService->processManualWebhook(
            $validated,
            $eventId,
            $signature,
        );

        return response()->json([
            'success' => true,
            'message' => $result['duplicate']
                ? 'Webhook sudah pernah diproses.'
                : 'Webhook pembayaran berhasil diproses.',
            'data' => [
                'reference' => $result['payment']->reference,
                'status' => $result['payment']->status,
            ],
        ]);
    }
}
