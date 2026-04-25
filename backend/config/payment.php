<?php

return [
    'default_provider' => env('PAYMENT_PROVIDER', 'MIDTRANS'),
    'operations_alert_webhook_url' => env('OPERATIONS_ALERT_WEBHOOK_URL'),
    'health_check_minutes_threshold' => (int) env('PAYMENT_HEALTH_CHECK_MINUTES_THRESHOLD', 20),
];
