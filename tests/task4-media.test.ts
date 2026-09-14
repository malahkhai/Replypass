import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizePhotoMime, PHOTO_MAX_BYTES, validPhotoSignature } from "../lib/media/image.ts";

const migration = readFileSync(new URL("../supabase/migrations/202609140001_paid_photo_and_deadlines.sql", import.meta.url), "utf8");
const upload = readFileSync(new URL("../app/api/media/photo/upload/route.ts", import.meta.url), "utf8");
const deliver = readFileSync(new URL("../app/api/media/photo/deliver/route.ts", import.meta.url), "utf8");
const access = readFileSync(new URL("../app/api/account/media/[id]/route.ts", import.meta.url), "utf8");

test("photo validation rejects extensions and checks real container signatures", () => {
  assert.equal(normalizePhotoMime("image/jpeg"), "image/jpeg");
  assert.equal(normalizePhotoMime("application/x-msdownload"), null);
  assert.equal(PHOTO_MAX_BYTES, 20 * 1024 * 1024);
  assert.equal(validPhotoSignature(Uint8Array.from([0xff,0xd8,0xff,0xe0]), "image/jpeg"), true);
  assert.equal(validPhotoSignature(Uint8Array.from([0x4d,0x5a,0x90,0]), "image/jpeg"), false);
  assert.equal(validPhotoSignature(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "image/png"), true);
});

test("upload is private and cannot claim fulfillment or capture", () => {
  assert.match(upload, /createSignedUploadUrl/);
  assert.match(upload, /payment\.interaction_kind !== "photo"/);
  assert.doesNotMatch(upload, /reconcile|deliver_paid_media|capture/);
  assert.match(migration, /values\('paid-deliveries','paid-deliveries',false/);
});

test("explicit delivery validates ownership, object path, MIME, size and creates entitlement before capture", () => {
  assert.match(deliver, /ownedPayment\(paymentId, viewer\.id, "creator"\)/);
  assert.match(deliver, /validPhotoSignature/);
  assert.match(migration, /object_path not like p\.interaction_id::text\|\|'\/'\|\|actor::text/);
  assert.match(migration, /insert into public\.media_entitlements[\s\S]*operation='capture'/);
  assert.match(migration, /pg_advisory_xact_lock/);
});

test("two server deadlines and idempotent expiry are enforced", () => {
  assert.match(migration, /acceptance_expires_at/);
  assert.match(migration, /fulfillment_expires_at:=now\(\)\+interval '48 hours'/);
  assert.match(migration, /p\.fulfillment_media_id is not null then return/);
});

test("signed media access requires captured payment and ownership", () => {
  assert.match(access, /payment\.payment_state === "captured"/);
  assert.match(access, /payment\?\.fan_id === viewer\.id/);
  assert.match(access, /createSignedUrl\(media\.storage_path, 300\)/);
  assert.match(access, /Cache-Control": "no-store"/);
});

test("payout readiness, immutable snapshots, blocks and service-only media tables remain enforced", () => {
  assert.match(migration, /not acct\.ready/);
  assert.match(migration, /select \* into price from public\.creator_pricing/);
  assert.match(migration, /exists\(select 1 from public\.blocks/);
  assert.match(migration, /revoke all on public\.paid_media_deliveries from anon, authenticated/);
});
