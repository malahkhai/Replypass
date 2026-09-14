import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  normalizeVoiceMime,
  validVoiceSignature,
  VOICE_MAX_BYTES,
  VOICE_MAX_DURATION_MS,
} from "../lib/media/audio.ts";

test("voice MIME normalization is narrow and strips recorder codecs", () => {
  assert.equal(normalizeVoiceMime("audio/webm;codecs=opus"), "audio/webm");
  assert.equal(normalizeVoiceMime("audio/mp4"), "audio/mp4");
  assert.equal(normalizeVoiceMime("video/mp4"), null);
  assert.equal(VOICE_MAX_BYTES, 20 * 1024 * 1024);
  assert.equal(VOICE_MAX_DURATION_MS, 300_000);
});

test("voice delivery checks real container signatures", () => {
  assert.equal(validVoiceSignature(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3, ...Array(28).fill(0)]), "audio/webm"), true);
  assert.equal(validVoiceSignature(Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, ...Array(24).fill(0)]), "audio/mp4"), true);
  assert.equal(validVoiceSignature(Uint8Array.from([0x4d, 0x5a, ...Array(30).fill(0)]), "audio/mpeg"), false);
});

test("migration makes delivery and entitlement atomic before capture", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609140001_paid_photo_and_deadlines.sql", import.meta.url), "utf8");
  assert.match(sql, /insert into public\.media_entitlements/);
  assert.match(sql, /create function public\.deliver_paid_media/);
  assert.match(sql, /insert into public\.media_entitlements[\s\S]*update public\.reply_payments set fulfillment_media_id=mid,fulfillment_message_id=marker,operation='capture'/);
  assert.match(sql, /p\.interaction_kind='message' and sender=owner/);
  assert.match(sql, /new\.payment_state='captured'[\s\S]*status='available'/);
  assert.match(sql, /status='available'/);
  assert.match(sql, /new\.payment_state='captured'/);
});
