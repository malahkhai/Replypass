import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { connectAccountTable } from "../lib/stripe/account-table.ts";

test("Stripe modes choose separate creator payout records", () => {
  assert.equal(connectAccountTable("live"), "creator_stripe_accounts");
  assert.equal(connectAccountTable("test"), "creator_stripe_sandbox_accounts");
});

test("sandbox migration restores archived test account without updating live Connect", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/202610020001_sandbox_connect_isolation.sql", import.meta.url),
    "utf8",
  );
  assert.match(sql, /where mode='test'/);
  assert.match(sql, /if payment_mode='live' then[\s\S]*from public\.creator_stripe_accounts[\s\S]*else[\s\S]*from public\.creator_stripe_sandbox_accounts/);
  assert.match(sql, /stripe_mode\)\s*values\(/);
  assert.doesNotMatch(sql, /update public\.creator_stripe_accounts/i);
});
