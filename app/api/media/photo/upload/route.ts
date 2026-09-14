import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { normalizePhotoMime, PHOTO_MAX_BYTES, photoExtension } from "@/lib/media/image";
import { ownedPayment, replyService } from "@/lib/stripe/service";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role)) return fail("Creator sign-in required.", 401);
  try {
    const { requestId, mime: rawMime, bytes } = await readJson(request);
    const mime = typeof rawMime === "string" ? normalizePhotoMime(rawMime) : null;
    if (!/^[0-9a-f-]{36}$/.test(requestId) || !mime || !Number.isInteger(bytes) || bytes < 1 || bytes > PHOTO_MAX_BYTES)
      return fail("Choose a JPG, PNG or WebP under 20 MB.");
    const service = replyService();
    const { data } = await service.db.from("reply_payments").select("id").eq("request_id", requestId).single();
    if (!data) return fail("Request unavailable.", 404);
    const payment = await ownedPayment(data.id, viewer.id, "creator");
    const deadline = payment.fulfillment_expires_at || payment.expires_at;
    if (payment.interaction_kind !== "photo" || payment.payment_state !== "authorized" || !payment.accepted_at || payment.fulfillment_media_id)
      return fail("This photo request is not ready for delivery.", 409);
    if (!deadline || Date.parse(deadline) <= Date.now()) return fail("This photo request has expired.", 409);
    const path = `${payment.interaction_id}/${viewer.id}/${crypto.randomUUID()}.${photoExtension(mime)}`;
    const { data: signed, error } = await service.db.storage.from("paid-deliveries").createSignedUploadUrl(path);
    if (error || !signed?.token) throw Error("Upload unavailable");
    return Response.json({ bucket: "paid-deliveries", path, token: signed.token, mime, paymentId: payment.id });
  } catch {
    return fail("Unable to prepare this private photo upload.", 409);
  }
}
