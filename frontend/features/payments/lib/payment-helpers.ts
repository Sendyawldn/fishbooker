import type { PaymentDetails } from "@/lib/api";

export function getPaymentStatusTone(
  payment: Pick<PaymentDetails, "status" | "method">,
): string {
  if (payment.status === "PAID") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (payment.status === "PENDING") {
    return payment.method === "CASH"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}
