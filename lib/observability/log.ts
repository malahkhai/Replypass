import "server-only";
import { randomUUID } from "node:crypto";

type LogContext = Record<string, string | number | boolean | null | undefined>;
const allowed = new Set(["event","request_id","transaction_id","creator_id","fan_id","stripe_event_id","status","error_code","job","route","subject_id"]);

export function requestId(request?: Request) {
  return request?.headers.get("x-request-id") || randomUUID();
}

export function logEvent(level: "info" | "warn" | "error", context: LogContext) {
  const safe = Object.fromEntries(Object.entries(context).filter(([key,value]) => allowed.has(key) && value !== undefined));
  const line = JSON.stringify({ level, timestamp: new Date().toISOString(), ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function captureException(error: unknown, context: LogContext) {
  const code = error instanceof Error ? error.name : "UnknownError";
  logEvent("error", { ...context, error_code: code });
  // Provider hook: an SDK can consume this sanitized event in Task 7.
  globalThis.dispatchEvent?.(new Event("replypass:server-error"));
}
