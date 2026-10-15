import { tryDeliverCreatorAdminEvents } from "@/lib/notifications/creator-lifecycle";
import { xCreatorConversionId } from "@/lib/analytics/x-conversion";
import { reportXCreatorRegistration } from "@/lib/analytics/x-server";
import { logEvent } from "@/lib/observability/log";
import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/session";
import { demoCookieOptions } from "@/lib/auth/demo";
import { validateCreator } from "@/lib/creators/validation";
import { readJson, fail } from "@/lib/http";
import { serviceDatabase } from "@/lib/stripe/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export async function POST(request: Request) {
  try {
    const draft = await readJson(request);
    const errors = validateCreator(draft);
    if (errors.length) return fail(errors[0]);
    const supabase = await createClient();
    if (!supabase) {
      if (
        draft.username === "stella" &&
        (await getViewer())?.role !== "creator"
      )
        return fail("That username is taken.", 409);
      const encoded = Buffer.from(JSON.stringify(draft)).toString("base64url");
      if (encoded.length > 3600)
        return fail("Please shorten your bio or links for the local demo.");
      const jar = await cookies();
      jar.set("replypass_demo_creator", encoded, demoCookieOptions);
      jar.set("replypass_demo_session", "creator", demoCookieOptions);
      return NextResponse.json({ ok: true, demo: true });
    }
    const viewer = await getViewer();
    if (!viewer) return fail("Sign in before launching your page.", 401);
    const { data: verifiedAuth } = await supabase.auth.getUser();
    if (!verifiedAuth.user?.email_confirmed_at) return fail("Verify your email before publishing your profile.", 403);
    const limited = await enforceRateLimit(request, "requestAction", viewer.id);
    if (limited) return limited;
    const db = serviceDatabase();
    const { data: previous, error: previousError } = await db.from("creator_profiles")
      .select("submitted_at")
      .eq("profile_id", viewer.id)
      .maybeSingle();
    if (previousError) throw previousError;
    const firstLaunch = !previous?.submitted_at;
    const { error } = await supabase.rpc("save_creator_profile_with_audience", { draft });
    if (error)
      return fail(
        error.code === "23505"
          ? "That username was just taken. Please choose another."
          : "Your profile could not be saved. Check the fields and try again.",
        409,
      );
    const launchedAt = new Date().toISOString();
    const { error: termsError } = await db.from("creator_profiles").update({
      submitted_at: launchedAt,
      community_terms_accepted_at: new Date().toISOString(),
      community_terms_version: "2026-09-launch-draft",
    }).eq("profile_id", viewer.id);
    if (termsError) throw termsError;
    after(tryDeliverCreatorAdminEvents);
    if (firstLaunch) after(async () => {
      try { await reportXCreatorRegistration(viewer.id, launchedAt); }
      catch { logEvent("error", { event: "x_creator_registration", status: "delivery_failed", creator_id: viewer.id }); }
    });
    return NextResponse.json({
      ok: true,
      ...(firstLaunch ? { xConversionId: xCreatorConversionId(viewer.id) } : {}),
    });
  } catch {
    return fail("Unable to save. Please try again.");
  }
}
