import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("notification upsert has a matching non-partial conflict index", () => {
  const migration = readFileSync(
    new URL("../supabase/migrations/202610060002_notification_event_conflict.sql", import.meta.url),
    "utf8",
  );
  const service = readFileSync(
    new URL("../lib/notifications/service.ts", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create unique index notifications_event_key_unique\s+on public\.notifications\(recipient_id,\s*event_key\);/i);
  assert.doesNotMatch(migration, /where\s+event_key\s+is\s+not\s+null/i);
  assert.match(service, /onConflict:\s*"recipient_id,event_key"/);
});
