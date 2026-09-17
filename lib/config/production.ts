export type ProductionReadiness = { ok: boolean; missing: string[] };

export function productionReadiness(env: NodeJS.ProcessEnv = process.env): ProductionReadiness {
  if (env.NODE_ENV !== "production") return { ok: true, missing: [] };
  const required = ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","NEXT_PUBLIC_APP_URL","CRON_SECRET","RATE_LIMIT_REST_URL","RATE_LIMIT_REST_TOKEN"];
  const missing = required.filter((key) => !env[key]);
  return { ok: missing.length === 0, missing };
}

export function assertFinancialProductionReady(env: NodeJS.ProcessEnv = process.env) {
  const readiness = productionReadiness(env);
  if (!readiness.ok) throw Error("Production financial configuration is incomplete.");
  if (env.NODE_ENV === "production" && env.REPLYPASS_DEMO_MODE === "true") throw Error("Demo payments are disabled in production.");
}
