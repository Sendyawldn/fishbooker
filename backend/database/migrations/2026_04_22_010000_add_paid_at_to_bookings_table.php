<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->timestamp('paid_at')->nullable()->after('expires_at');
            $table->index(['status', 'expires_at']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropIndex(['status', 'expires_at']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn('paid_at');
        });
    }
};
