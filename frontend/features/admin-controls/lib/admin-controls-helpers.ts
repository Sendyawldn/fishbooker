import type { AdminCustomer } from "@/lib/api";

export function getCustomerAccessTone(customer: Pick<AdminCustomer, "is_booking_blocked">): string {
  return customer.is_booking_blocked
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function summarizeAdminCustomers(customers: AdminCustomer[]): {
  blockedCount: number;
  activeHoldCount: number;
} {
  return customers.reduce(
    (summary, customer) => ({
      blockedCount: summary.blockedCount + (customer.is_booking_blocked ? 1 : 0),
      activeHoldCount:
        summary.activeHoldCount + customer.active_pending_bookings_count,
    }),
    {
      blockedCount: 0,
      activeHoldCount: 0,
    },
  );
}
