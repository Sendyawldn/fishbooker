import { ApiError, type BookingWithSlot } from "../../../lib/api.ts";

export function getBookingHistoryTone(
  status: BookingWithSlot["status"],
): string {
  if (status === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function getBookingHistoryLabel(
  status: BookingWithSlot["status"],
): string {
  if (status === "SUCCESS") {
    return "Selesai";
  }

  if (status === "PENDING") {
    return "Masih Hold";
  }

  return "Batal / Expired";
}

export function formatBookingHistoryDateTime(
  isoString?: string | null,
): string {
  if (!isoString) {
    return "-";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatBookingHistoryCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function getBookingHistoryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "Riwayat booking belum bisa dimuat sekarang.";
}
