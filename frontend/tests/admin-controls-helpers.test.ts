import assert from "node:assert/strict";
import test from "node:test";
import type { AdminCustomer } from "../lib/api.ts";
import {
  getCustomerAccessTone,
  summarizeAdminCustomers,
} from "../features/admin-controls/lib/admin-controls-helpers.ts";

const CUSTOMERS_FIXTURE: AdminCustomer[] = [
  {
    id: 1,
    name: "Budi",
    email: "budi@example.com",
    role: "PELANGGAN",
    is_booking_blocked: false,
    booking_block_reason: null,
    active_pending_bookings_count: 2,
    successful_bookings_count: 4,
    cancelled_bookings_count: 1,
  },
  {
    id: 2,
    name: "Sari",
    email: "sari@example.com",
    role: "PELANGGAN",
    is_booking_blocked: true,
    booking_block_reason: "Spam booking",
    active_pending_bookings_count: 1,
    successful_bookings_count: 1,
    cancelled_bookings_count: 3,
  },
];

test("should return blocked tone for blocked customer", () => {
  assert.equal(
    getCustomerAccessTone(CUSTOMERS_FIXTURE[1]),
    "border-rose-200 bg-rose-50 text-rose-700",
  );
});

test("should summarize blocked customer count and active holds", () => {
  assert.deepEqual(summarizeAdminCustomers(CUSTOMERS_FIXTURE), {
    blockedCount: 1,
    activeHoldCount: 3,
  });
});
