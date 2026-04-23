import assert from "node:assert/strict";
import test from "node:test";
import { getPaymentStatusTone } from "../features/payments/lib/payment-helpers.ts";

test("should use success tone when payment is paid", () => {
  assert.equal(
    getPaymentStatusTone({
      status: "PAID",
      method: "MANUAL_TRANSFER",
    }),
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  );
});

test("should use cash pending tone when payment waits for cash confirmation", () => {
  assert.equal(
    getPaymentStatusTone({
      status: "PENDING",
      method: "CASH",
    }),
    "border-amber-200 bg-amber-50 text-amber-700",
  );
});

test("should use transfer pending tone when transfer payment is still waiting", () => {
  assert.equal(
    getPaymentStatusTone({
      status: "PENDING",
      method: "MANUAL_TRANSFER",
    }),
    "border-sky-200 bg-sky-50 text-sky-700",
  );
});

test("should use failure tone for non pending and non paid states", () => {
  assert.equal(
    getPaymentStatusTone({
      status: "FAILED",
      method: "MANUAL_TRANSFER",
    }),
    "border-rose-200 bg-rose-50 text-rose-700",
  );
});
