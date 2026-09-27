import test from "node:test";
import assert from "node:assert/strict";
import { paidRequestAvailable, launchProducts } from "../lib/launch/scope.ts";
import { vipAccessEligible } from "../lib/vip/model.ts";

test("V1 permits only a Guaranteed Reply paid request", () => {
  assert.equal(launchProducts.vip, true);
  assert.equal(paidRequestAvailable("message"), true);
  for (const postponed of ["voice_note", "photo", "video", "live_chat", "tips", "vip", "unknown"])
    assert.equal(paidRequestAvailable(postponed), false, postponed);
});

test("VIP content access ends at the paid-through instant, including cancellation", () => {
  const end = "2026-09-27T12:00:00.000Z";
  assert.equal(vipAccessEligible("active", end, Date.parse(end) - 1), true);
  assert.equal(vipAccessEligible("active", end, Date.parse(end)), false);
  assert.equal(vipAccessEligible("canceled", end, Date.parse(end) - 1), false);
  assert.equal(vipAccessEligible("active", null, Date.parse(end) - 1), false);
});
