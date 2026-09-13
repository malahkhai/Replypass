import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Meta Purchase is webhook-confirmed and uses server-authoritative money", () => {
  const webhook = readFileSync(new URL("../lib/stripe/webhooks.ts", import.meta.url), "utf8");
  const server = readFileSync(new URL("../lib/analytics/meta-server.ts", import.meta.url), "utf8");
  assert.match(webhook, /event\.type === "payment_intent\.succeeded"/);
  assert.match(server, /payment\.gross_cents \/ 100/);
  assert.match(server, /payment\.currency\.toUpperCase\(\)/);
  assert.match(server, /hash\(`replypass_purchase:\$\{payment\.id\}`\)/);
  assert.match(server, /consent\?\.allowed/);
  assert.doesNotMatch(server, /NEXT_PUBLIC_META_CONVERSIONS_API_TOKEN/);
});

test("Meta consent and event ledgers are service-role only", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609130003_meta_conversions.sql", import.meta.url), "utf8");
  assert.match(sql, /enable row level security/g);
  assert.match(sql, /revoke all on public\.marketing_consents, public\.marketing_conversion_events from anon, authenticated/);
  assert.match(sql, /grant all on public\.marketing_consents, public\.marketing_conversion_events to service_role/);
});
