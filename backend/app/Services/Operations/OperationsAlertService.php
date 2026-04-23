<?php

namespace App\Services\Operations;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OperationsAlertService
{
    public function sendPaymentHealthAlert(string $summary, array $context): void
    {
        $webhookUrl = (string) config('payment.operations_alert_webhook_url');

        if ($webhookUrl === '') {
            return;
        }

        try {
            Http::acceptJson()
                ->asJson()
                ->timeout(10)
                ->post($webhookUrl, [
                    'event' => 'fishbooker.payment_health_alert',
                    'summary' => $summary,
                    'context' => $context,
                    'timestamp' => now()->toISOString(),
                ])
                ->throw();
        } catch (\Throwable $exception) {
            Log::warning('operations.payment_health_alert_delivery_failed', [
                'message' => $exception->getMessage(),
            ]);
        }
    }
}
