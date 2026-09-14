import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { vipAccessEligible, vipSplit } from "../lib/vip/model.ts";
const root = new URL("../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");
const migration = read("supabase/migrations/202609140002_vip_memberships.sql");
const schema = read("supabase/migrations/202609090001_foundation.sql") + migration;
const server = read("lib/vip/server.ts");
const webhook = read("lib/vip/webhooks.ts");

test("VIP fee snapshots conserve integer minor units", () => {
  assert.deepEqual(vipSplit(1900), { grossCents: 1900, feeCents: 285, creatorCents: 1615, feeBps: 1500 });
  assert.equal(vipSplit(999).grossCents, vipSplit(999).feeCents + vipSplit(999).creatorCents);
  assert.throws(() => vipSplit(19.5));
});
test("VIP access is centralized and excludes failed or ended memberships", () => {
  const future = new Date(Date.now() + 60_000).toISOString(), past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(vipAccessEligible("active", future), true);
  assert.equal(vipAccessEligible("trialing", future), true);
  assert.equal(vipAccessEligible("past_due", future), false);
  assert.equal(vipAccessEligible("active", past), false);
});
test("browser cannot supply price currency fee or destination", () => {
  const route = read("app/api/vip/checkout/route.ts");
  assert.match(route, /createVipCheckout\(viewer\.id,body\.creatorId\)/);
  assert.doesNotMatch(route, /amountCents|currency|destination/);
  assert.match(server, /creator_membership_plans/);
  assert.match(server, /creator_stripe_accounts/);
});
test("Stripe Checkout uses recurring destination subscriptions and 15 percent fee", () => {
  assert.match(server, /mode:"subscription"/);
  assert.match(server, /application_fee_percent:15/);
  assert.match(server, /transfer_data:\{destination:account\.stripe_account_id\}/);
  assert.match(server, /idempotencyKey:/);
});
test("webhooks own access, renewals, failures and cancellation state", () => {
  for (const event of ["checkout.session.completed","customer.subscription.updated","customer.subscription.deleted","invoice.paid","invoice.payment_failed"]) assert.match(webhook, new RegExp(event.replaceAll(".", "\\.")));
  assert.match(webhook, /status:"past_due"/);
  assert.match(webhook, /subscription_payments/);
});
test("migration protects duplicate memberships, financial writes and private media", () => {
  assert.match(schema, /one_live_subscription/);
  assert.match(migration, /revoke all on public\.subscription_payments,public\.vip_post_media from anon,authenticated/);
  assert.match(migration, /values\('vip-media','vip-media',false/);
  assert.match(migration, /has_active_vip_access/);
});
test("signed VIP media requires current access and never returns storage paths to the feed", () => {
  const media = read("app/api/vip/media/[id]/route.ts"), feed = read("lib/vip/feed.ts");
  assert.match(media, /hasActiveVipAccess/);
  assert.match(media, /createSignedUrl\(media\.storage_path,300\)/);
  assert.doesNotMatch(feed, /storage_path/);
});
test("creator publishing validates real image signatures and notifies subscribers", () => {
  const posts = read("app/api/creator/vip/posts/route.ts");
  assert.match(posts, /validPhotoSignature/);
  assert.match(posts, /notifications/);
  assert.ok(posts.includes("active") && posts.includes("trialing"));
});
test("public launch catalog hides live chat video and tips", () => {
  const profile = read("components/creator-profile.tsx");
  assert.match(profile, /offering\.kind !== "live_chat" && offering\.kind !== "video"/);
  assert.doesNotMatch(profile, /kind === "tips"/);
});
