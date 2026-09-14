import { getViewer } from "@/lib/auth/session";
import { fail, readJson, sameOrigin } from "@/lib/http";
import { serviceDatabase } from "@/lib/stripe/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return fail("Sign in required.", 401);
  try {
    const requestId = (await params).id;
    const { action, reason = "Request made me uncomfortable" } = await readJson(request);
    if (!/^[0-9a-f-]{36}$/.test(requestId) || !["report", "block"].includes(action)) return fail("Invalid safety action.");
    const db = serviceDatabase();
    const { data: payment } = await db.from("reply_payments").select("fan_id,creator_id").eq("request_id", requestId).maybeSingle();
    if (!payment) return fail("Request unavailable.", 404);
    const { data: creator } = await db.from("creator_profiles").select("profile_id").eq("id", payment.creator_id).single();
    const creatorUser = creator?.profile_id;
    if (viewer.id !== payment.fan_id && viewer.id !== creatorUser && viewer.role !== "admin") return fail("Request unavailable.", 404);
    const other = viewer.id === payment.fan_id ? creatorUser : payment.fan_id;
    if (!other) return fail("Request unavailable.", 404);
    if (action === "block") {
      const { error } = await db.from("blocks").upsert({ blocker_id: viewer.id, blocked_id: other }, { onConflict: "blocker_id,blocked_id" });
      if (error) throw error;
    } else {
      const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 2000) : "Request reported";
      const { error } = await db.from("reports").insert({ reporter_id: viewer.id, reported_profile_id: other, request_id: requestId, reason: cleanReason || "Request reported" });
      if (error) throw error;
    }
    return Response.json({ ok: true });
  } catch { return fail("Unable to save this safety action.", 409); }
}
