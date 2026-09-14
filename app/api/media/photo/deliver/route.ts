import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { normalizePhotoMime, PHOTO_MAX_BYTES, validPhotoSignature } from "@/lib/media/image";
import { ownedPayment, replyService } from "@/lib/stripe/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role)) return fail("Creator sign-in required.", 401);
  let uploadedPath = "";
  try {
    const { paymentId, path, mime: rawMime, bytes } = await readJson(request);
    const mime = typeof rawMime === "string" ? normalizePhotoMime(rawMime) : null;
    if (!/^[0-9a-f-]{36}$/.test(paymentId) || typeof path !== "string" || !mime || !Number.isInteger(bytes) || bytes < 1 || bytes > PHOTO_MAX_BYTES)
      return fail("Photo details are invalid.");
    const payment = await ownedPayment(paymentId, viewer.id, "creator");
    if (payment.interaction_kind !== "photo" || !path.startsWith(`${payment.interaction_id}/${viewer.id}/`)) return fail("Photo delivery is not authorized.", 403);
    uploadedPath = path;
    const service = replyService();
    const { data: file, error } = await service.db.storage.from("paid-deliveries").download(path);
    if (error || !file || file.size !== bytes || file.size > PHOTO_MAX_BYTES) throw Error("Uploaded photo could not be verified");
    const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!validPhotoSignature(signature, mime)) throw Error("Photo format mismatch");
    const { data, error: commitError } = await service.db.rpc("deliver_paid_media", {
      payment: payment.id, actor: viewer.id, object_path: path, mime, bytes, duration: null,
    });
    if (commitError || !data?.media_id) throw Error("Delivery could not be committed");
    let reconciliation = false;
    try { await service.engine.reconcile(payment.id); } catch { reconciliation = true; }
    return Response.json({ delivered: true, reconciliation });
  } catch {
    // Keep a committed asset for reconciliation. Only remove an orphan that was never linked.
    if (uploadedPath) {
      try {
        const service = replyService();
        const { data } = await service.db.from("media").select("id").eq("storage_path", uploadedPath).maybeSingle();
        if (!data) await service.db.storage.from("paid-deliveries").remove([uploadedPath]);
      } catch { /* Expiry reconciliation can remove orphaned objects. */ }
    }
    return fail("We couldn't finalize this delivery yet. Your photo is safe if it was committed; payment will be reconciled.", 409);
  }
}
