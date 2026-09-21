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
  const ready = productionReadiness(productionEnv());
  assert.equal(ready.ok, true);
  assert.equal(ready.launchReady, false);
  assert.ok(ready.blockers.includes("stripe_live_mode_not_enabled"));
});

function productionEnv(): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    SUPABASE_SERVICE_ROLE_KEY: "service",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_public",
    STRIPE_SECRET_KEY: "sk_test_secret",
    STRIPE_WEBHOOK_SECRET: "whsec_payments",
    STRIPE_CONNECT_WEBHOOK_SECRET: "whsec_connect",
    NEXT_PUBLIC_APP_URL: "https://getreplypass.com",
    CRON_SECRET: "x".repeat(32),
    RATE_LIMIT_REST_URL: "https://example.upstash.io",
    RATE_LIMIT_REST_TOKEN: "token",
    EMAIL_PROVIDER: "resend",
    EMAIL_API_KEY: "secret",
    EMAIL_FROM: "ReplyPass <notifications@getreplypass.com>",
  };
}

test("launch migration keeps operational records service-role only", () => {
  const sql = readFileSync(new URL("../supabase/migrations/202609150001_launch_hardening.sql", import.meta.url), "utf8");
  assert.match(sql, /create table public\.admin_audit_log/);
  assert.match(sql, /create table public\.refund_records/);
  assert.match(sql, /create table public\.stripe_disputes/);
  assert.match(sql, /revoke all on public\.%I from anon,authenticated/);
  assert.match(sql, /account_status in \('active','suspended','deletion_requested','anonymized'\)/);
});

test("admin creator listing uses the owner profile relationship explicitly", () => {
  const repository = readFileSync(
    new URL("../lib/admin/repository.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    repository,
    /profiles!creator_profiles_profile_id_fkey\(display_name,account_status\)/,
  );
});

test("Vercel Upstash variables satisfy readiness without mixing credential pairs", () => {
  const base = { ...productionEnv() };
  delete base.RATE_LIMIT_REST_URL;
  delete base.RATE_LIMIT_REST_TOKEN;
  const env: NodeJS.ProcessEnv = { ...base, KV_REST_API_URL: "https://example.upstash.io", KV_REST_API_TOKEN: "test-token" };
  assert.equal(productionReadiness(env).ok, true);
  assert.ok(productionReadiness({ ...env, RATE_LIMIT_REST_URL: "https://custom.example" }).missing.includes("RATE_LIMIT_REST_TOKEN"));
  assert.ok(productionReadiness({ ...env, KV_REST_API_TOKEN: undefined }).missing.includes("RATE_LIMIT_REST_TOKEN"));
});

test("launch readiness requires a complete live-mode measurement and monitoring setup", () => {
  const env: NodeJS.ProcessEnv = {
    ...productionEnv(),
    STRIPE_MODE: "live",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_public",
    STRIPE_SECRET_KEY: "sk_live_secret",
    NEXT_PUBLIC_GA_ENABLED: "true",
    NEXT_PUBLIC_META_ENABLED: "true",
    NEXT_PUBLIC_META_PIXEL_ID: "38840334095580076",
    ERROR_MONITORING_DSN: "https://public@example.ingest.sentry.io/123",
  };
  const readiness = productionReadiness(env);
  assert.equal(readiness.ok, true);
  assert.equal(readiness.launchReady, true);
  assert.deepEqual(readiness.blockers, []);
});

test("error reporting sends only sanitized exception metadata", () => {
  const provider = readFileSync(
    new URL("../lib/observability/provider.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(provider, /request\.headers|request\.body|error\.message/);
  assert.match(provider, /error instanceof Error \? error\.name/);
  assert.match(provider, /contextKeys/);
});

test("production demo endpoints are explicitly disabled", () => {
  assert.match(readFileSync(new URL("../app/api/checkout/demo/route.ts", import.meta.url), "utf8"), /NODE_ENV === "production"/);
  assert.match(readFileSync(new URL("../app/api/auth/demo/route.ts", import.meta.url), "utf8"), /NODE_ENV === "production"/);
});
