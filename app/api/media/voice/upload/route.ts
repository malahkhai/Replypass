import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { normalizeVoiceMime, VOICE_MAX_BYTES, VOICE_MAX_DURATION_MS, VOICE_MIN_DURATION_MS, voiceExtension } from "@/lib/media/audio";
import { ownedPayment, replyService } from "@/lib/stripe/service";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role))
    return fail("Creator sign-in required.", 401);
  try {
    const { requestId, mime: rawMime, bytes, durationMs } = await readJson(request);
    const mime = typeof rawMime === "string" ? normalizeVoiceMime(rawMime) : null;
    if (
      !/^[0-9a-f-]{36}$/.test(requestId) ||
      !mime ||
      !Number.isInteger(bytes) || bytes < 1 || bytes > VOICE_MAX_BYTES ||
      !Number.isInteger(durationMs) || durationMs < VOICE_MIN_DURATION_MS || durationMs > VOICE_MAX_DURATION_MS
    ) return fail("Choose a voice note under 5 minutes and 20 MB.");
    const service = replyService();
    const { data } = await service.db.from("reply_payments").select("id").eq("request_id", requestId).single();
    if (!data) return fail("Request unavailable.", 404);
    const payment = await ownedPayment(data.id, viewer.id, "creator");
    if (payment.interaction_kind !== "voice_note" || payment.payment_state !== "authorized" || !payment.accepted_at || payment.fulfillment_media_id)
      return fail("This voice-note request is not ready for delivery.", 409);
    const deadline = payment.fulfillment_expires_at || payment.expires_at;
    if (!deadline || Date.parse(deadline) <= Date.now())
      return fail("This voice-note request has expired.", 409);
    const path = `${payment.interaction_id}/${viewer.id}/${crypto.randomUUID()}.${voiceExtension(mime)}`;
    const { data: signed, error } = await service.db.storage.from("voice-deliveries").createSignedUploadUrl(path);
    if (error || !signed?.token) throw Error("Upload unavailable");
    return Response.json({ bucket: "voice-deliveries", path, token: signed.token, mime, paymentId: payment.id });
  } catch {
    return fail("Unable to prepare this voice-note upload.", 409);
  }
}
