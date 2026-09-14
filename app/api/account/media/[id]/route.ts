import { getViewer } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { serviceDatabase } from "@/lib/stripe/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return fail("Sign in required.", 401);
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail("Media unavailable.", 404);
  const db = serviceDatabase();
  const { data: entitlement } = await db
    .from("media_entitlements")
    .select("id,status,interaction_id,media:media_id(storage_path,mime_type,owner_id)")
    .eq("media_id", id)
    .maybeSingle();
  if (!entitlement) return fail("Media unavailable.", 404);
  const media = entitlement.media as unknown as { storage_path: string; mime_type: string; owner_id: string };
  const { data: payment } = await db.from("reply_payments").select("fan_id,payment_state").eq("interaction_id", entitlement.interaction_id).maybeSingle();
  const authorized = viewer.role === "admin" ||
    (media.owner_id === viewer.id && ["pending_capture", "available"].includes(entitlement.status)) ||
    (payment?.fan_id === viewer.id && payment.payment_state === "captured" && entitlement.status === "available");
  if (!authorized) return fail("Media unavailable.", 404);
  const bucket = media.mime_type.startsWith("audio/") ? "voice-deliveries" : "paid-deliveries";
  const { data, error } = await db.storage.from(bucket).createSignedUrl(media.storage_path, 300);
  if (error || !data) return fail("Playback unavailable.", 503);
  await db.from("media_entitlements").update({ first_viewed_at: new Date().toISOString() }).eq("id", entitlement.id).is("first_viewed_at", null);
  return Response.json({ url: data.signedUrl, mime: media.mime_type, expiresIn: 300, watermark: media.mime_type.startsWith("image/") ? `ReplyPass • ${entitlement.interaction_id.slice(0, 6).toUpperCase()}` : null }, { headers: { "Cache-Control": "no-store" } });
}
