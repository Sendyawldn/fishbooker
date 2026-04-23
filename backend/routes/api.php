<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\SlotController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\AdminReportingController;
use App\Http\Controllers\Api\AdminBookingOperationsController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/slots', [SlotController::class, 'index']);
Route::post('/payments/webhooks/manual', [PaymentWebhookController::class, 'manual']);
Route::post('/payments/webhooks/midtrans', [PaymentWebhookController::class, 'midtrans']);
Route::middleware(['auth:sanctum'])->get('/auth/me', [AuthController::class, 'me']);
Route::middleware(['auth:sanctum'])->post('/auth/logout', [AuthController::class, 'logout']);
Route::middleware(['auth:sanctum'])->get('/bookings/me', [BookingController::class, 'index']);
Route::middleware(['auth:sanctum'])->post('/bookings', [BookingController::class, 'store']);
Route::middleware(['auth:sanctum'])->post('/bookings/{booking}/payments', [PaymentController::class, 'store']);
Route::middleware(['auth:sanctum'])->get('/payments/{reference}', [PaymentController::class, 'show']);
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::post('/admin/slots', [SlotController::class, 'store']);
    Route::patch('/admin/slots/{slot}', [SlotController::class, 'update']);
    Route::delete('/admin/slots/{slot}', [SlotController::class, 'destroy']);
    Route::get('/admin/dashboard', [AdminReportingController::class, 'index']);
    Route::get('/admin/reports/finance/export', [AdminReportingController::class, 'exportFinance']);
    Route::post('/admin/payments/{payment}/confirm-cash', [AdminReportingController::class, 'confirmCashPayment']);
    Route::get('/admin/bookings', [AdminBookingOperationsController::class, 'index']);
    Route::post('/admin/bookings/{booking}/cancel', [AdminBookingOperationsController::class, 'cancel']);
});

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/payments/webhooks/manual', [PaymentWebhookController::class, 'manual']);
    Route::post('/payments/webhooks/midtrans', [PaymentWebhookController::class, 'midtrans']);
    Route::get('/slots', [SlotController::class, 'index']);
    Route::middleware(['auth:sanctum'])->get('/auth/me', [AuthController::class, 'me']);
    Route::middleware(['auth:sanctum'])->post('/auth/logout', [AuthController::class, 'logout']);
    Route::middleware(['auth:sanctum'])->get('/bookings/me', [BookingController::class, 'index']);
    Route::middleware(['auth:sanctum'])->post('/bookings', [BookingController::class, 'store']);
    Route::middleware(['auth:sanctum'])->post('/bookings/{booking}/payments', [PaymentController::class, 'store']);
    Route::middleware(['auth:sanctum'])->get('/payments/{reference}', [PaymentController::class, 'show']);

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::post('/admin/slots', [SlotController::class, 'store']);
        Route::patch('/admin/slots/{slot}', [SlotController::class, 'update']);
        Route::delete('/admin/slots/{slot}', [SlotController::class, 'destroy']);
        Route::get('/admin/dashboard', [AdminReportingController::class, 'index']);
        Route::get('/admin/reports/finance/export', [AdminReportingController::class, 'exportFinance']);
        Route::post('/admin/payments/{payment}/confirm-cash', [AdminReportingController::class, 'confirmCashPayment']);
        Route::get('/admin/bookings', [AdminBookingOperationsController::class, 'index']);
        Route::post('/admin/bookings/{booking}/cancel', [AdminBookingOperationsController::class, 'cancel']);
    });
});
