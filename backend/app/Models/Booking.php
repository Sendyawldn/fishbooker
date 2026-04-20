<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'slot_id', 'booking_time', 'expires_at', 'status'])]
class Booking extends Model
{
    protected function casts(): array
    {
        return [
            'booking_time' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
