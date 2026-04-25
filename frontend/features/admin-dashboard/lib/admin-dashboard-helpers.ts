import {
  ApiError,
  type AdminDashboardData,
  type PaymentStatus,
} from "../../../lib/api.ts";

export function formatDashboardCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function formatDashboardDateTime(value?: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getDashboardPaymentStatusTone(status: PaymentStatus): string {
  if (status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-600";
}

export function getDashboardOperationsHealthTone(
  operationsHealth: AdminDashboardData["operations_health"],
): string {
  return operationsHealth.needs_attention
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function getDashboardErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Dashboard admin belum bisa dimuat sekarang.";
}
