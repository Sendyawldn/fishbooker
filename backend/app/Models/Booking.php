<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'slot_id', 'booking_time', 'status'])]
class Booking extends Model
{
    // Relasi ke User dan Slot bisa ditambahkan nanti
}
