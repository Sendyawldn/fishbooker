<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'booking_id',
    'user_id',
    'provider',
    'method',
    'status',
    'amount',
    'currency',
    'reference',
    'gateway_reference',
    'checkout_url',
    'expires_at',
    'paid_at',
    'metadata',
])]
class Payment extends Model
{
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'paid_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function webhookEvents(): HasMany
    {
        return $this->hasMany(PaymentWebhookEvent::class);
    }

    public function financialJournals(): HasMany
    {
        return $this->hasMany(FinancialJournal::class);
    }
}
