type SafeContext = Record<string, string | number | boolean | null | undefined>;

const contextKeys = new Set([
  "event",
  "request_id",
  "transaction_id",
  "creator_id",
  "fan_id",
  "stripe_event_id",
  "status",
  "error_code",
  "job",
  "route",
  "subject_id",
]);

/** Sends a deliberately minimal Sentry envelope. No messages, headers or request bodies leave ReplyPass. */
export async function reportException(error: unknown, context: SafeContext) {
  const dsn = process.env.ERROR_MONITORING_DSN;
  if (!dsn) return false;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, "");
    if (!projectId || !url.username || url.protocol !== "https:") return false;
    const endpoint = `${url.protocol}//${url.host}/api/${projectId}/envelope/`;
    const eventId = crypto.randomUUID().replaceAll("-", "");
    const safe = Object.fromEntries(
      Object.entries(context).filter(
        ([key, value]) => contextKeys.has(key) && value !== undefined,
      ),
    );
    const type = error instanceof Error ? error.name : "UnknownError";
    const envelope = [
      JSON.stringify({
        event_id: eventId,
        dsn,
        sent_at: new Date().toISOString(),
      }),
      JSON.stringify({ type: "event" }),
      JSON.stringify({
        event_id: eventId,
        timestamp: Date.now() / 1000,
        level: "error",
        platform: "javascript",
        exception: { values: [{ type, value: "Sanitized server exception" }] },
        tags: safe,
      }),
    ].join("\n");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7,sentry_key=${url.username}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
