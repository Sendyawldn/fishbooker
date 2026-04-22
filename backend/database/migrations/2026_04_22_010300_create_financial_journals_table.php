<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_journals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('entry_type', 64);
            $table->unsignedBigInteger('amount');
            $table->string('currency', 8)->default('IDR');
            $table->string('description', 255);
            $table->timestamp('recorded_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['payment_id', 'entry_type']);
            $table->index(['entry_type', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_journals');
    }
};
