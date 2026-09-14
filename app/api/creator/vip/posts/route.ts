import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { normalizePhotoMime, PHOTO_MAX_BYTES, validPhotoSignature } from "@/lib/media/image";
import { serviceDatabase } from "@/lib/stripe/server";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  let orphan = "";
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role)) return fail("Creator sign-in required.", 401);
    const body = await readJson(request), text = String(body.body || "").trim(), path = body.path ? String(body.path) : null;
    const mime = path ? normalizePhotoMime(String(body.mime || "")) : null, bytes = path ? Number(body.bytes) : null;
    if (!text && !path) return fail("Write an update or add a photo.");
    if (text.length > 5000 || (path && (!mime || !Number.isInteger(bytes) || bytes === null || bytes < 1 || bytes > PHOTO_MAX_BYTES))) return fail("Post details are invalid.");
    const db = serviceDatabase();
    const { data: creator } = await db.from("creator_profiles").select("id").eq("profile_id", viewer.id).single();
    if (!creator) return fail("Creator profile required.", 404);
    const { data: plan } = await db.from("creator_membership_plans").select("enabled").eq("creator_id", creator.id).single();
    if (!plan?.enabled) return fail("Enable VIP before publishing.", 409);
    if (path) {
      if (!path.startsWith(`${creator.id}/`)) return fail("Upload is not yours.", 403);
      orphan = path;
      const { data: file, error } = await db.storage.from("vip-media").download(path);
      if (error || !file || file.size !== bytes) throw Error();
      if (!validPhotoSignature(new Uint8Array(await file.slice(0, 16).arrayBuffer()), mime!)) return fail("Photo format mismatch.");
    }
    const { data: post, error } = await db.from("vip_posts").insert({ creator_id: creator.id, body: text }).select("id").single();
    if (error || !post) throw Error();
    if (path) {
      const { error: mediaError } = await db.from("vip_post_media").insert({ post_id: post.id, creator_id: creator.id, storage_path: path, mime_type: mime, size_bytes: bytes });
      if (mediaError) throw Error();
      orphan = "";
    }
    const { data: members } = await db.from("subscriptions").select("fan_id").eq("creator_id", creator.id).in("status", ["active", "trialing"]).or(`current_period_end.is.null,current_period_end.gt.${new Date().toISOString()}`);
    if (members?.length) await db.from("notifications").insert(members.map((m) => ({ recipient_id: m.fan_id, kind: "subscription", title: `${viewer.displayName} posted a new VIP update 💖`, body: "Open your VIP feed to see it." })));
    return Response.json({ ok: true, id: post.id });
  } catch {
    if (orphan) try { await serviceDatabase().storage.from("vip-media").remove([orphan]); } catch {}
    return fail("VIP post could not be published.", 409);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.demo || !["creator", "admin"].includes(viewer.role)) return fail("Creator sign-in required.", 401);
    const { postId } = await readJson(request);
    if (!postId || typeof postId !== "string") return fail("Post required.");
    const db = serviceDatabase();
    const { data: creator } = await db.from("creator_profiles").select("id").eq("profile_id", viewer.id).single();
    if (!creator) return fail("Creator profile required.", 404);
    const { data: post, error } = await db.from("vip_posts").select("id,vip_post_media(storage_path)").eq("id", postId).eq("creator_id", creator.id).single();
    if (error || !post) return fail("Post not found.", 404);
    const media = post.vip_post_media as unknown as { storage_path: string }[] | { storage_path: string } | null;
    const paths = (Array.isArray(media) ? media : media ? [media] : []).map((item) => item.storage_path);
    if (paths.length) {
      const { error:storageError } = await db.storage.from("vip-media").remove(paths);
      if (storageError) return fail("Private media could not be removed.", 409);
    }
    const { error:deleteError } = await db.from("vip_posts").delete().eq("id", postId).eq("creator_id", creator.id);
    if (deleteError) throw Error();
    return Response.json({ ok: true });
  } catch {
    return fail("VIP post could not be deleted.", 409);
  }
}
