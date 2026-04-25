<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExternalReadinessCommandTest extends TestCase
{
    public function test_should_fail_production_readiness_when_required_external_configuration_is_missing(): void
    {
        config()->set('app.url', 'http://localhost');
        config()->set('app.frontend_url', 'http://localhost:3000');
        config()->set('services.midtrans.server_key', '');
        config()->set('services.midtrans.client_key', '');
        config()->set('services.midtrans.is_production', false);
        config()->set('services.midtrans.demo_mode', true);
        config()->set('payment.operations_alert_webhook_url', '');

        $this->artisan('release:external-readiness --production')
            ->expectsOutput('FishBooker external readiness check found blocking gaps.')
            ->assertExitCode(1);
    }

    public function test_should_pass_production_readiness_when_required_external_configuration_is_present(): void
    {
        config()->set('app.url', 'https://api.fishbooker.test');
        config()->set('app.frontend_url', 'https://fishbooker.test');
        config()->set('services.midtrans.server_key', 'mid-prod-server-key');
        config()->set('services.midtrans.client_key', 'mid-prod-client-key');
        config()->set('services.midtrans.is_production', true);
        config()->set('services.midtrans.demo_mode', false);
        config()->set('payment.operations_alert_webhook_url', 'https://hooks.example.test/fishbooker');

        $this->artisan('release:external-readiness --production')
            ->expectsOutput('FishBooker external readiness check is fully ready from the repository side.')
            ->assertExitCode(0);
    }
}
