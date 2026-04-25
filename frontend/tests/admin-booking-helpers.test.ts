import assert from "node:assert/strict";
import test from "node:test";
import type { AdminBooking } from "../lib/api.ts";
import {
  getAdminBookingTone,
  summarizeAdminBookings,
} from "../features/admin-bookings/lib/admin-booking-helpers.ts";

const BOOKINGS_FIXTURE: AdminBooking[] = [
  {
    id: 1,
    user_id: 1,
    slot_id: 11,
    booking_time: "2026-04-23T01:00:00.000Z",
    expires_at: "2026-04-23T01:15:00.000Z",
    status: "PENDING",
    slot: {
      id: 11,
      slot_number: 11,
      status: "DIBOOKING",
      price: 80000,
    },
    user: {
      id: 1,
      name: "Budi",
      email: "budi@example.com",
      role: "PELANGGAN",
      is_booking_blocked: true,
      booking_block_reason: "Sering membiarkan hold kedaluwarsa.",
    },
    latest_payment: {
      id: 1,
      reference: "pay-1",
      provider: "MIDTRANS",
      method: "MIDTRANS_SNAP",
      status: "PENDING",
      amount: 80000,
      checkout_url: "https://example.test/checkout",
      expires_at: "2026-04-23T01:15:00.000Z",
      paid_at: null,
    },
  },
  {
    id: 2,
    user_id: 2,
    slot_id: 12,
    booking_time: "2026-04-23T02:00:00.000Z",
    expires_at: null,
    paid_at: "2026-04-23T02:10:00.000Z",
    status: "SUCCESS",
    slot: {
      id: 12,
      slot_number: 12,
      status: "DIBOOKING",
      price: 95000,
    },
    user: {
      id: 2,
      name: "Sari",
      email: "sari@example.com",
      role: "PELANGGAN",
      is_booking_blocked: false,
      booking_block_reason: null,
    },
    latest_payment: {
      id: 2,
      reference: "pay-2",
      provider: "MIDTRANS",
      method: "MIDTRANS_SNAP",
      status: "PAID",
      amount: 95000,
      checkout_url: null,
      expires_at: null,
      paid_at: "2026-04-23T02:10:00.000Z",
    },
  },
];

test("should return pending tone for pending admin booking", () => {
  assert.equal(
    getAdminBookingTone("PENDING"),
    "border-amber-200 bg-amber-50 text-amber-700",
  );
});

test(
  "should summarize pending, paid, blocked customers, and visible amount from admin bookings",
  () => {
  assert.deepEqual(summarizeAdminBookings(BOOKINGS_FIXTURE), {
    pendingCount: 1,
    paidCount: 1,
    blockedCustomerCount: 1,
    visibleAmount: 175000,
  });
  },
);
