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
    .select("id,status,media:media_id(storage_path,mime_type)")
    .eq("media_id", id)
    .eq("fan_id", viewer.id)
    .maybeSingle();
  if (!entitlement || entitlement.status !== "available") return fail("Media unavailable.", 404);
  const media = entitlement.media as unknown as { storage_path: string; mime_type: string };
  const { data, error } = await db.storage.from("voice-deliveries").createSignedUrl(media.storage_path, 300);
  if (error || !data) return fail("Playback unavailable.", 503);
  await db.from("media_entitlements").update({ first_viewed_at: new Date().toISOString() }).eq("id", entitlement.id).is("first_viewed_at", null);
  return Response.json({ url: data.signedUrl, mime: media.mime_type }, { headers: { "Cache-Control": "no-store" } });
}
