<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_booking_blocked')->default(false)->after('role');
            $table->string('booking_block_reason')->nullable()->after('is_booking_blocked');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['is_booking_blocked', 'booking_block_reason']);
        });
    }
};
