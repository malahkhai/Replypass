import { getViewer } from "@/lib/auth/session";
import { readJson, fail, sameOrigin } from "@/lib/http";
import { prepareCheckout } from "@/lib/stripe/service";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { paidRequestAvailable } from "@/lib/launch/scope";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo)
    return fail("Sign in to start a secured request.", 401);
  const limited = await enforceRateLimit(request, "payment", viewer.id);
  if (limited) return limited;
  try {
    const { creatorId, attemptKey, message, kind = "message" } = await readJson(request);
    if (
      !/^[0-9a-f-]{36}$/.test(creatorId) ||
      !/^[0-9a-f-]{36}$/.test(attemptKey) ||
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000 ||
      !paidRequestAvailable(kind)
    )
      return fail("Check your message and try again.");
    const result = await prepareCheckout(
      viewer.id,
      creatorId,
      attemptKey,
      message,
      kind as "message" | "voice_note" | "photo",
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return fail(
      "Unable to reserve this request. Check creator availability or try again shortly.",
      409,
    );
  }
}
