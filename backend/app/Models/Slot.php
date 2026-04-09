<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slot_number', 'status', 'price'])]
class Slot extends Model
{
    // Model untuk manajemen lapak pemancingan
}
