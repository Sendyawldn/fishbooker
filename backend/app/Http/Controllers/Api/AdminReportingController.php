<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\Payments\PaymentWebhookService;
use App\Services\Reporting\AdminReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminReportingController extends Controller
{
    public function index(AdminReportingService $adminReportingService): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard admin berhasil diambil.',
            'data' => $adminReportingService->buildDashboard(),
        ]);
    }

    public function exportFinance(AdminReportingService $adminReportingService): Response
    {
        $csv = $adminReportingService->exportFinanceCsv();

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="fishbooker-finance-report.csv"',
        ]);
    }

    public function confirmCashPayment(
        Request $request,
        Payment $payment,
        PaymentWebhookService $paymentWebhookService,
    ): JsonResponse {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $confirmedPayment = $paymentWebhookService->confirmCashPayment(
            $payment,
            $user,
            $validated['note'] ?? null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran tunai berhasil dikonfirmasi.',
            'data' => [
                'reference' => $confirmedPayment->reference,
                'status' => $confirmedPayment->status,
                'paid_at' => $confirmedPayment->paid_at?->toISOString(),
            ],
        ]);
    }
}
