<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Payments\MidtransSnapService;
use App\Services\Payments\PaymentWebhookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function manual(Request $request, PaymentWebhookService $paymentWebhookService): JsonResponse
    {
        $signature = $request->header('X-Fishbooker-Signature');
        $eventId = $request->header('X-Fishbooker-Event-Id');
        $rawPayload = $request->getContent();

        if (! $paymentWebhookService->verifyManualWebhookSignature($rawPayload, $signature)) {
            Log::warning('payments.manual_webhook.invalid_signature', [
                'event_id' => $eventId,
                'payment_reference' => $request->input('payment_reference'),
                'ip' => $request->ip(),
            ]);

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

        Log::info('payments.manual_webhook.accepted', [
            'event_id' => $eventId,
            'payment_reference' => $result['payment']->reference,
            'payment_status' => $result['payment']->status,
            'duplicate' => $result['duplicate'],
        ]);

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

    public function midtrans(
        Request $request,
        PaymentWebhookService $paymentWebhookService,
        MidtransSnapService $midtransSnapService,
    ): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'uuid'],
            'status_code' => ['required', 'string', 'max:8'],
            'gross_amount' => ['required', 'string', 'max:32'],
            'transaction_status' => ['required', 'string', 'max:32'],
            'transaction_id' => ['nullable', 'string', 'max:120'],
            'payment_type' => ['nullable', 'string', 'max:64'],
            'fraud_status' => ['nullable', 'string', 'max:32'],
            'signature_key' => ['required', 'string', 'max:128'],
            'transaction_time' => ['nullable', 'string', 'max:64'],
            'settlement_time' => ['nullable', 'string', 'max:64'],
        ]);

        if (! $midtransSnapService->verifyNotificationSignature($validated)) {
            Log::warning('payments.midtrans_webhook.invalid_signature', [
                'order_id' => $request->input('order_id'),
                'transaction_status' => $request->input('transaction_status'),
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Midtrans signature tidak valid.',
            ], 401);
        }

        $result = $paymentWebhookService->processMidtransWebhook($validated);

        Log::info('payments.midtrans_webhook.accepted', [
            'order_id' => $result['payment']->reference,
            'payment_status' => $result['payment']->status,
            'duplicate' => $result['duplicate'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['duplicate']
                ? 'Webhook Midtrans sudah pernah diproses.'
                : 'Webhook Midtrans berhasil diproses.',
            'data' => [
                'reference' => $result['payment']->reference,
                'status' => $result['payment']->status,
            ],
        ]);
    }
}
