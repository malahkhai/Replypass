import { getViewer } from "@/lib/auth/session";
import { readJson, fail } from "@/lib/http";
import { serviceDatabase } from "@/lib/stripe/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo) return fail("Sign in required.", 401);
  const limited = await enforceRateLimit(request, "requestAction", viewer.id);
  if (limited) return limited;
  try {
    const { confirmation } = await readJson(request);
    if (confirmation !== "DELETE MY ACCOUNT") return fail("Type DELETE MY ACCOUNT to confirm.");
    const db = serviceDatabase();
    const now = new Date().toISOString();
    const { error } = await db.from("profiles").update({ account_status: "deletion_requested", deletion_requested_at: now }).eq("id", viewer.id).eq("account_status", "active");
    if (error) throw error;
    const { data: memberships } = await db.from("subscriptions").select("id,stripe_subscription_id").eq("fan_id", viewer.id).in("status", ["active", "trialing", "past_due"]);
    const secret = process.env.STRIPE_SECRET_KEY;
    if (secret && memberships?.length) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(secret, { maxNetworkRetries: 2 });
      for (const membership of memberships) if (membership.stripe_subscription_id) await stripe.subscriptions.cancel(membership.stripe_subscription_id, {}, { idempotencyKey: `replypass:delete:${membership.id}` });
    }
    return Response.json({ ok: true });
  } catch { return fail("We could not start account deletion. Please contact support.", 409); }
}
