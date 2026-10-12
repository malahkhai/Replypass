import assert from "node:assert/strict";
import test from "node:test";
import { payoutNumbers } from "../lib/stripe/payout-numbers.ts";

test("creator payout stages do not treat a transfer or scheduled payout as paid", () => {
  const result = payoutNumbers(
    {
      pending: [{ amount: 340, currency: "eur" }, { amount: 500, currency: "usd" }],
      available: [{ amount: 120, currency: "eur" }],
    },
    [
      { amount: 70, currency: "eur", status: "pending", arrival_date: 100 },
      { amount: 80, currency: "eur", status: "in_transit", arrival_date: 200 },
      { amount: 60, currency: "eur", status: "paid", arrival_date: 50 },
      { amount: 900, currency: "eur", status: "failed", arrival_date: 30 },
      { amount: 800, currency: "usd", status: "paid", arrival_date: 40 },
    ],
  );
  assert.deepEqual(result, {
    pendingCents: 340,
    availableCents: 120,
    scheduledCents: 70,
    inTransitCents: 80,
    paidCents: 60,
    nextArrival: 200,
  });
});
