import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { postXConversion, xCreatorConversion } from "../lib/analytics/x-conversion.ts";

test("X registration carries a normalized, hashed email and stable dedupe ID", () => {
  const conversion = xCreatorConversion(
    "tw-rha5c-example",
    "00000000-0000-0000-0000-000000000001",
    "  Fan@Example.COM ",
    "2026-10-15T12:34:56.000Z",
  );
  assert.equal(conversion.identifiers[0].hashed_email,
    createHash("sha256").update("fan@example.com").digest("hex"));
  assert.equal(conversion.conversion_time, "2026-10-15T12:34:56.000Z");
  assert.match(conversion.conversion_id, /^[a-f0-9]{64}$/);
  assert.equal(conversion.conversion_id,
    xCreatorConversion("tw-rha5c-example", "00000000-0000-0000-0000-000000000001", "fan@example.com", "2026-10-15T12:34:56.000Z").conversion_id);
  assert.ok(!JSON.stringify(conversion).includes("Fan@Example.COM"));
});

test("X conversion omits delivery without an email identifier", () => {
  assert.throws(() => xCreatorConversion("tw-rha5c-example", "profile", "  ", new Date().toISOString()));
});

test("X CAPI posts the confirmed conversion server-side with the token header", async () => {
  const conversion = xCreatorConversion("tw-rha5c-rhab8", "profile", "creator@example.com", "2026-10-15T12:34:56.000Z");
  let called = false;
  const response = await postXConversion("test-token", conversion, async (url, options) => {
    called = true;
    assert.equal(url, "https://ads-api.x.com/12/measurement/conversions/rha5c");
    assert.equal(options?.method, "POST");
    assert.equal((options?.headers as Record<string, string>)["X-Pixel-Token"], "test-token");
    assert.deepEqual(JSON.parse(options?.body as string), { conversions: [conversion] });
    return new Response(null, { status: 200 });
  });
  assert.equal(called, true);
  assert.equal(response.status, 200);
});
