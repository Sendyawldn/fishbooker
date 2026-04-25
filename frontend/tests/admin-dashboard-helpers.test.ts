import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../lib/api.ts";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  getDashboardErrorMessage,
  getDashboardOperationsHealthTone,
  getDashboardPaymentStatusTone,
} from "../features/admin-dashboard/lib/admin-dashboard-helpers.ts";

test("should format dashboard currency using rupiah locale", () => {
  assert.equal(formatDashboardCurrency(125000), "Rp 125.000");
});

test("should return fallback marker for invalid dashboard datetime", () => {
  assert.equal(formatDashboardDateTime("not-a-date"), "-");
});

test("should return warning tone for pending dashboard payment", () => {
  assert.equal(
    getDashboardPaymentStatusTone("PENDING"),
    "border-amber-200 bg-amber-50 text-amber-700",
  );
});

test("should return alert tone when dashboard operations health needs attention", () => {
  assert.equal(
    getDashboardOperationsHealthTone({
      minutes_threshold: 20,
      stale_pending_payments: 1,
      expired_pending_bookings: 0,
      needs_attention: true,
    }),
    "border-rose-200 bg-rose-50 text-rose-700",
  );
});

test("should surface api error messages for dashboard failures", () => {
  assert.equal(
    getDashboardErrorMessage(new ApiError("Dashboard gagal", 500, null)),
    "Dashboard gagal",
  );
});
