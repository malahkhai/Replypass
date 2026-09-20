import test from "node:test";
import assert from "node:assert/strict";
import { checkRateLimit } from "../lib/security/rate-limit.ts";
import { productionReadiness } from "../lib/config/production.ts";
import { readFileSync } from "node:fs";

test("rate limiting blocks after the configured window budget", async () => {
  const rule = { limit: 2, windowSeconds: 60 };
  assert.equal((await checkRateLimit("launch-test", rule, 1000)).allowed, true);
  assert.equal((await checkRateLimit("launch-test", rule, 1000)).allowed, true);
  assert.equal((await checkRateLimit("launch-test", rule, 1000)).allowed, false);
  assert.equal((await checkRateLimit("launch-test", rule, 62001)).allowed, true);
});

test("production readiness requires shared rate limiting and secrets", () => {
  const missing = productionReadiness({ NODE_ENV: "production" });
  assert.equal(missing.ok, false);
  assert.ok(missing.missing.includes("STRIPE_WEBHOOK_SECRET"));
  const ready = productionReadiness({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "x", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x", SUPABASE_SERVICE_ROLE_KEY: "x", STRIPE_SECRET_KEY: "x", STRIPE_WEBHOOK_SECRET: "x", NEXT_PUBLIC_APP_URL: "https://getreplypass.com", CRON_SECRET: "x", RATE_LIMIT_REST_URL: "x", RATE_LIMIT_REST_TOKEN: "x" });
  assert.equal(ready.ok, true);
});

test("launch migration keeps operational records service-role only", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609150001_launch_hardening.sql", import.meta.url), "utf8");
  assert.match(sql, /create table public\.admin_audit_log/);
  assert.match(sql, /create table public\.refund_records/);
  assert.match(sql, /create table public\.stripe_disputes/);
  assert.match(sql, /revoke all on public\.%I from anon,authenticated/);
  assert.match(sql, /account_status in \('active','suspended','deletion_requested','anonymized'\)/);
});

test("Vercel Upstash variables satisfy readiness without mixing credential pairs", () => {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "x", NEXT_PUBLIC_SUPABASE_ANON_KEY: "x", SUPABASE_SERVICE_ROLE_KEY: "x", STRIPE_SECRET_KEY: "x", STRIPE_WEBHOOK_SECRET: "x", NEXT_PUBLIC_APP_URL: "https://getreplypass.com", CRON_SECRET: "x", KV_REST_API_URL: "https://example.upstash.io", KV_REST_API_TOKEN: "test-token" };
  assert.equal(productionReadiness(env).ok, true);
  assert.ok(productionReadiness({ ...env, RATE_LIMIT_REST_URL: "https://custom.example" }).missing.includes("RATE_LIMIT_REST_TOKEN"));
  assert.ok(productionReadiness({ ...env, KV_REST_API_TOKEN: undefined }).missing.includes("RATE_LIMIT_REST_TOKEN"));
});

test("production demo endpoints are explicitly disabled", () => {
  assert.match(readFileSync(new URL("../app/api/checkout/demo/route.ts", import.meta.url), "utf8"), /NODE_ENV === "production"/);
  assert.match(readFileSync(new URL("../app/api/auth/demo/route.ts", import.meta.url), "utf8"), /NODE_ENV === "production"/);
});
