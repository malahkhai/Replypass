import { getViewer } from "@/lib/auth/session";
import { readJson, fail } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return fail("Sign in required.", 401);
  const limited = await enforceRateLimit(request, "requestAction", viewer.id);
  if (limited) return limited;
  try {
    const body = await readJson(request);
    const updates: Record<string, unknown> = {};
    if (body.displayName !== undefined) {
      if (typeof body.displayName !== "string" || !body.displayName.trim() || body.displayName.length > 80) return fail("Enter a display name under 80 characters.");
      updates.display_name = body.displayName.trim();
    }
    if (body.emailRequests !== undefined) updates.email_requests = Boolean(body.emailRequests);
    if (body.emailMessages !== undefined) updates.email_messages = Boolean(body.emailMessages);
    if (body.emailPayments !== undefined) updates.email_payments = Boolean(body.emailPayments);
    if (body.emailSubscriptions !== undefined) updates.email_subscriptions = Boolean(body.emailSubscriptions);
    if (body.inAppEnabled !== undefined) updates.in_app_enabled = Boolean(body.inAppEnabled);
    if (!Object.keys(updates).length) return fail("No settings to update.");
    const client = await createClient();
    if (!client) return Response.json({ ok: true, demo: true });
    if (updates.display_name) {
      const { error } = await client.from("profiles").update({ display_name: updates.display_name }).eq("id", viewer.id);
      if (error) throw error;
      delete updates.display_name;
    }
    if (Object.keys(updates).length) {
      const { error } = await client.from("notification_preferences").upsert({ profile_id: viewer.id, ...updates }, { onConflict: "profile_id" });
      if (error) throw error;
    }
    return Response.json({ ok: true });
  } catch { return fail("Settings could not be saved.", 409); }
}
