import { stripeConfigurationStatus } from "../stripe/config.ts";

export type ProductionReadiness = {
  ok: boolean;
  launchReady: boolean;
  missing: string[];
  blockers: string[];
};

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_CONNECT_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "RATE_LIMIT_REST_URL",
  "RATE_LIMIT_REST_TOKEN",
  "EMAIL_PROVIDER",
  "EMAIL_API_KEY",
  "EMAIL_FROM",
] as const;

export function productionReadiness(env: NodeJS.ProcessEnv = process.env): ProductionReadiness {
  if (env.NODE_ENV !== "production")
    return { ok: true, launchReady: false, missing: [], blockers: [] };
  const customRateLimit = env.RATE_LIMIT_REST_URL || env.RATE_LIMIT_REST_TOKEN;
  const configured = customRateLimit ? env : {
    ...env,
    RATE_LIMIT_REST_URL: env.KV_REST_API_URL,
    RATE_LIMIT_REST_TOKEN: env.KV_REST_API_TOKEN,
  };
  const missing = required.filter((key) => !configured[key]);
  const blockers: string[] = [];
  const stripe = stripeConfigurationStatus(env);
  if (!stripe.ready) blockers.push("stripe_configuration_invalid");
  if (stripe.mode !== "live") blockers.push("stripe_live_mode_not_enabled");
  if (env.STRIPE_MODE && env.STRIPE_MODE !== stripe.mode)
    blockers.push("stripe_mode_mismatch");
  if (env.NEXT_PUBLIC_APP_URL !== "https://getreplypass.com")
    blockers.push("production_url_invalid");
  if (env.NEXT_PUBLIC_GA_ENABLED !== "true")
    blockers.push("ga4_not_enabled");
  if (env.NEXT_PUBLIC_META_ENABLED !== "true" || !env.NEXT_PUBLIC_META_PIXEL_ID)
    blockers.push("meta_measurement_not_enabled");
  if (!env.ERROR_MONITORING_DSN)
    blockers.push("error_monitoring_not_configured");
  if (env.REPLYPASS_DEMO_MODE === "true")
    blockers.push("demo_mode_forbidden");
  const fatal = [
    "stripe_configuration_invalid",
    "stripe_mode_mismatch",
    "production_url_invalid",
    "demo_mode_forbidden",
  ];
  return {
    ok: missing.length === 0 && !blockers.some((item) => fatal.includes(item)),
    launchReady: missing.length === 0 && blockers.length === 0,
    missing: [...missing],
    blockers,
  };
}

export function assertFinancialProductionReady(env: NodeJS.ProcessEnv = process.env) {
  const readiness = productionReadiness(env);
  if (!readiness.ok) throw Error("Production financial configuration is incomplete.");
}
