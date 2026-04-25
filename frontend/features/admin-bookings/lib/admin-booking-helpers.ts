import type { AdminBooking } from "@/lib/api";

export function getAdminBookingTone(status: AdminBooking["status"]): string {
  if (status === "SUCCESS") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "PENDING") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function summarizeAdminBookings(bookings: AdminBooking[]): {
  pendingCount: number;
  paidCount: number;
  blockedCustomerCount: number;
  visibleAmount: number;
} {
  return bookings.reduce(
    (summary, booking) => {
      if (booking.status === "PENDING") {
        summary.pendingCount += 1;
      }

      if (booking.latest_payment?.status === "PAID") {
        summary.paidCount += 1;
      }

      if (booking.user.is_booking_blocked) {
        summary.blockedCustomerCount += 1;
      }

      summary.visibleAmount += booking.slot.price;

      return summary;
    },
    {
      pendingCount: 0,
      paidCount: 0,
      blockedCustomerCount: 0,
      visibleAmount: 0,
    },
  );
}
