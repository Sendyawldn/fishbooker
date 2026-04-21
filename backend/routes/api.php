<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SlotController;
use App\Http\Controllers\Api\BookingController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/slots', [SlotController::class, 'index']);
Route::middleware(['auth:sanctum'])->get('/bookings/me', [BookingController::class, 'index']);
Route::middleware(['auth:sanctum'])->post('/bookings', [BookingController::class, 'store']);
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/slots', [SlotController::class, 'store']);
    Route::patch('/admin/slots/{slot}', [SlotController::class, 'update']);
    Route::delete('/admin/slots/{slot}', [SlotController::class, 'destroy']);
});

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::get('/slots', [SlotController::class, 'index']);
    Route::middleware(['auth:sanctum'])->get('/bookings/me', [BookingController::class, 'index']);
    Route::middleware(['auth:sanctum'])->post('/bookings', [BookingController::class, 'store']);

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::post('/admin/slots', [SlotController::class, 'store']);
        Route::patch('/admin/slots/{slot}', [SlotController::class, 'update']);
        Route::delete('/admin/slots/{slot}', [SlotController::class, 'destroy']);
    });
});
