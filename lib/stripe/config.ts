export function stripeConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const secret = env.STRIPE_SECRET_KEY;
  const publishable = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const webhook = env.STRIPE_WEBHOOK_SECRET;
  if (!secret && !publishable && !webhook && !env.STRIPE_CONNECT_WEBHOOK_SECRET)
    return null;
  if (
    env.STRIPE_CONNECT_WEBHOOK_SECRET &&
    !env.STRIPE_CONNECT_WEBHOOK_SECRET.startsWith("whsec_")
  )
    throw Error("Invalid Connect webhook configuration.");
  const secretMode = secret?.startsWith("sk_test_")
    ? "test"
    : secret?.startsWith("sk_live_")
      ? "live"
      : null;
  const publishableMode = publishable?.startsWith("pk_test_")
    ? "test"
    : publishable?.startsWith("pk_live_")
      ? "live"
      : null;
  if (!secretMode || !publishableMode || secretMode !== publishableMode || !webhook?.startsWith("whsec_"))
    throw Error("Stripe configuration is incomplete, invalid, or mixes test and live keys.");
  const requestedMode = env.STRIPE_MODE;
  if (requestedMode && !["test", "live"].includes(requestedMode))
    throw Error("STRIPE_MODE must be test or live.");
  if (requestedMode && requestedMode !== secretMode)
    throw Error("STRIPE_MODE does not match the configured Stripe keys.");
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  )
    throw Error("Stripe payments require a configured Supabase backend.");
  const seconds = Number(env.REPLY_EXPIRY_SECONDS || 86400);
  if (!Number.isSafeInteger(seconds) || seconds < 30 || seconds > 86400)
    throw Error("Reply expiry must be between 30 seconds and 24 hours.");
  return {
    secret: secret!,
    publishable: publishable!,
    webhook: webhook!,
    expirySeconds: seconds,
    mode: secretMode,
    livemode: secretMode === "live",
  } as const;
}

type Shape =
  | "missing"
  | "test"
  | "configured"
  | "invalid"
  | "live";
function keyShape(value: string | undefined, testPrefix: string): Shape {
  if (!value) return "missing";
  if (value.startsWith(testPrefix)) return "test";
  if (value.startsWith(testPrefix.replace("test", "live")))
    return "live";
  return "invalid";
}
/** Safe to show to an authenticated operator: values and identifiers are never returned. */
export function stripeConfigurationStatus(
  env: Record<string, string | undefined> = process.env,
) {
  const publishableKey = keyShape(
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    "pk_test_",
  );
  const secretKey = keyShape(env.STRIPE_SECRET_KEY, "sk_test_");
  const webhookSecret: Shape = !env.STRIPE_WEBHOOK_SECRET
    ? "missing"
    : env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")
      ? "configured"
      : "invalid";
  const connectWebhookSecret: Shape = !env.STRIPE_CONNECT_WEBHOOK_SECRET
    ? "missing"
    : env.STRIPE_CONNECT_WEBHOOK_SECRET.startsWith("whsec_")
      ? "configured"
      : "invalid";
  const cronSecret =
    !env.CRON_SECRET || env.CRON_SECRET.length < 32 ? "missing" : "configured";
  return {
    publishableKey,
    secretKey,
    webhookSecret,
    connectWebhookSecret,
    cronSecret,
    supabase: {
      url: !!env.NEXT_PUBLIC_SUPABASE_URL,
      anonymousKey: !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
    },
    mode:
      publishableKey === secretKey && ["test", "live"].includes(publishableKey)
        ? publishableKey
        : "invalid",
    ready:
      publishableKey === secretKey &&
      ["test", "live"].includes(publishableKey) &&
      webhookSecret === "configured" &&
      connectWebhookSecret === "configured" &&
      cronSecret === "configured" &&
      !!env.NEXT_PUBLIC_SUPABASE_URL &&
      !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !!env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
