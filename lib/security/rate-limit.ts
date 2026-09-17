import { createHash } from "node:crypto";

type Limit = { limit: number; windowSeconds: number };
type Entry = { count: number; resetAt: number };
const local = new Map<string, Entry>();

export const limits = {
  auth: { limit: 10, windowSeconds: 60 },
  payment: { limit: 8, windowSeconds: 60 },
  message: { limit: 30, windowSeconds: 60 },
  media: { limit: 20, windowSeconds: 60 },
  requestAction: { limit: 20, windowSeconds: 60 },
  report: { limit: 5, windowSeconds: 600 },
  admin: { limit: 30, windowSeconds: 60 },
} satisfies Record<string, Limit>;

export function rateLimitKey(request: Request, scope: string, actor?: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const source = actor || forwarded || request.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${scope}:${source}`).digest("hex");
}

async function remoteLimit(key: string, rule: Limit) {
  const url = process.env.RATE_LIMIT_REST_URL;
  const token = process.env.RATE_LIMIT_REST_TOKEN;
  if (!url || !token) return null;
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, rule.windowSeconds, "NX"],
      ["TTL", key],
    ]),
    cache: "no-store",
  });
  if (!response.ok) throw Error("Rate-limit store unavailable.");
  const values = (await response.json()) as { result: number }[];
  return { allowed: values[0].result <= rule.limit, remaining: Math.max(0, rule.limit - values[0].result), retryAfter: Math.max(1, values[2].result) };
}

export async function checkRateLimit(key: string, rule: Limit, now = Date.now()) {
  const remote = await remoteLimit(`replypass:rate:${key}`, rule);
  if (remote) return remote;
  // Development/test fallback. Production config validation requires a shared store.
  const current = local.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + rule.windowSeconds * 1000 }
    : { count: current.count + 1, resetAt: current.resetAt };
  local.set(key, entry);
  return { allowed: entry.count <= rule.limit, remaining: Math.max(0, rule.limit - entry.count), retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
}

export async function enforceRateLimit(request: Request, scope: keyof typeof limits, actor?: string) {
  const result = await checkRateLimit(rateLimitKey(request, scope, actor), limits[scope]);
  if (result.allowed) return null;
  return Response.json({ error: "Too many attempts. Please try again shortly." }, {
    status: 429,
    headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" },
  });
}
