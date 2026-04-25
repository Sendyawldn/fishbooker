import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../lib/api.ts";
import {
  formatBookingHistoryCurrency,
  formatBookingHistoryDateTime,
  getBookingHistoryErrorMessage,
  getBookingHistoryLabel,
  getBookingHistoryTone,
} from "../features/bookings/lib/booking-history-helpers.ts";

test("should return success label for completed booking history item", () => {
  assert.equal(getBookingHistoryLabel("SUCCESS"), "Selesai");
});

test("should return pending tone for pending booking history item", () => {
  assert.equal(
    getBookingHistoryTone("PENDING"),
    "border-amber-200 bg-amber-50 text-amber-700",
  );
});

test("should format booking history currency using rupiah locale", () => {
  assert.equal(formatBookingHistoryCurrency(98000), "Rp 98.000");
});

test("should return fallback marker for invalid booking history datetime", () => {
  assert.equal(formatBookingHistoryDateTime("invalid-date"), "-");
});

test("should surface api error messages for booking history failures", () => {
  assert.equal(
    getBookingHistoryErrorMessage(
      new ApiError("Riwayat tidak tersedia", 503, null),
    ),
    "Riwayat tidak tersedia",
  );
});
