import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { normalizeVoiceMime, validVoiceSignature, VOICE_MAX_BYTES, VOICE_MAX_DURATION_MS, VOICE_MIN_DURATION_MS } from "@/lib/media/audio";
import { ownedPayment, replyService } from "@/lib/stripe/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role))
    return fail("Creator sign-in required.", 401);
  let uploadedPath = "";
  try {
    const { paymentId, path, mime: rawMime, bytes, durationMs } = await readJson(request);
    const mime = typeof rawMime === "string" ? normalizeVoiceMime(rawMime) : null;
    if (
      !/^[0-9a-f-]{36}$/.test(paymentId) || typeof path !== "string" || !mime ||
      !Number.isInteger(bytes) || bytes < 1 || bytes > VOICE_MAX_BYTES ||
      !Number.isInteger(durationMs) || durationMs < VOICE_MIN_DURATION_MS || durationMs > VOICE_MAX_DURATION_MS
    ) return fail("Voice-note details are invalid.");
    const payment = await ownedPayment(paymentId, viewer.id, "creator");
    if (payment.interaction_kind !== "voice_note" || !path.startsWith(`${payment.interaction_id}/${viewer.id}/`))
      return fail("Voice-note delivery is not authorized.", 403);
    uploadedPath = path;
    const service = replyService();
    const { data: file, error: downloadError } = await service.db.storage.from("voice-deliveries").download(path);
    if (downloadError || !file || file.size !== bytes || file.size > VOICE_MAX_BYTES)
      throw Error("Uploaded voice note could not be verified");
    const head = new Uint8Array((await file.slice(0, 32).arrayBuffer()));
    if (!validVoiceSignature(head, mime)) throw Error("Voice note format mismatch");
    const { data, error } = await service.db.rpc("deliver_paid_media", {
      payment: payment.id,
      actor: viewer.id,
      object_path: path,
      mime,
      bytes,
      duration: durationMs,
    });
    if (error || !data?.media_id) throw Error("Delivery could not be committed");
    let reconciliation = false;
    try { await service.engine.reconcile(payment.id); } catch { reconciliation = true; }
    return Response.json({ delivered: true, reconciliation });
  } catch {
    if (uploadedPath) {
      try {
        const service = replyService();
        const { data } = await service.db.from("media").select("id").eq("storage_path", uploadedPath).maybeSingle();
        if (!data) await service.db.storage.from("voice-deliveries").remove([uploadedPath]);
      } catch { /* Reconciliation cleans orphaned objects. */ }
    }
    return fail("We couldn't finalize this delivery yet. Your recording is safe if it was committed; payment will be reconciled.", 409);
  }
}
