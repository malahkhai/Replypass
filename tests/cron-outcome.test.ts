import test from "node:test";
import assert from "node:assert/strict";
import { cronBatchOutcome } from "../lib/cron/outcome.ts";

test("notification delivery issues stay visible without failing the scheduler", () => {
  const result = cronBatchOutcome({
    processed: 0,
    paymentAttention: 0,
    notificationAttention: 1,
  });

  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.body, {
    processed: 0,
    paymentAttention: 0,
    notificationAttention: 1,
    attention: 1,
  });
  assert.deepEqual(result.run, {
    status: "failed",
    processed: 0,
    attention: 1,
    error_code: "notification_delivery_needs_attention",
  });
});

test("payment reconciliation failures stay recorded while the cron remains enabled", () => {
  const result = cronBatchOutcome({
    processed: 2,
    paymentAttention: 1,
    notificationAttention: 0,
  });

  assert.equal(result.httpStatus, 200);
  assert.equal(result.run.status, "failed");
  assert.equal(result.run.error_code, "payment_items_need_attention");
});

test("a clean batch is recorded as succeeded", () => {
  const result = cronBatchOutcome({
    processed: 3,
    paymentAttention: 0,
    notificationAttention: 0,
  });

  assert.equal(result.httpStatus, 200);
  assert.deepEqual(result.run, {
    status: "succeeded",
    processed: 3,
    attention: 0,
    error_code: null,
  });
});
