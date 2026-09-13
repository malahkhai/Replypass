import "server-only";
import { createHash } from "node:crypto";
import { serviceDatabase } from "@/lib/stripe/server";
import type { ReplyPayment } from "@/lib/stripe/engine";
import { validMetaPixelId } from "./model";

const GRAPH_VERSION = "v23.0";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function configured() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CONVERSIONS_API_TOKEN;
  return process.env.NEXT_PUBLIC_META_ENABLED === "true" && validMetaPixelId(pixelId) && token
    ? { pixelId: pixelId!, token }
    : null;
}

export async function reportMetaPurchase(payment: ReplyPayment) {
  const config = configured();
  if (!config || payment.payment_state !== "captured") return;
  const db = serviceDatabase();
  const eventId = hash(`replypass_purchase:${payment.id}`);
  const { data: existing, error: existingError } = await db
    .from("marketing_conversion_events")
    .select("sent_at,attempts")
    .eq("event_id", eventId)
    .maybeSingle();
  if (existingError) throw Error("Meta conversion ledger is unavailable.");
  if (existing?.sent_at) return;
  const { data: consent } = await db
    .from("marketing_consents")
    .select("allowed,fbp,fbc,client_user_agent")
    .eq("profile_id", payment.fan_id)
    .maybeSingle();
  if (!consent?.allowed) return;
  const { data: authUser } = await db.auth.admin.getUserById(payment.fan_id);
  const userData: Record<string, string | string[]> = {};
  if (authUser.user?.email) userData.em = [hash(authUser.user.email)];
  if (consent.fbp) userData.fbp = consent.fbp;
  if (consent.fbc) userData.fbc = consent.fbc;
  if (consent.client_user_agent) userData.client_user_agent = consent.client_user_agent;
  const { error: ledgerError } = await db.from("marketing_conversion_events").upsert(
    {
      event_id: eventId,
      event_name: "Purchase",
      profile_id: payment.fan_id,
      source_id: payment.id,
      attempts: (existing?.attempts || 0) + 1,
    },
    { onConflict: "event_id" },
  );
  if (ledgerError) throw Error("Meta conversion ledger is unavailable.");
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: config.token,
        data: [
          {
            event_name: "Purchase",
            event_time: Math.floor(
              new Date(payment.captured_at || Date.now()).getTime() / 1000,
            ),
            event_id: eventId,
            action_source: "website",
            event_source_url: "https://getreplypass.com/creator_profile",
            user_data: userData,
            custom_data: {
              currency: payment.currency.toUpperCase(),
              value: payment.gross_cents / 100,
              content_type: "product",
              content_ids: [payment.interaction_kind],
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    const { error: failureError } = await db
      .from("marketing_conversion_events")
      .update({ last_error: `Meta HTTP ${response.status}` })
      .eq("event_id", eventId);
    if (failureError) throw Error("Meta conversion failure could not be recorded.");
    throw Error("Meta conversion delivery requires retry.");
  }
  const { error: sentError } = await db
    .from("marketing_conversion_events")
    .update({ sent_at: new Date().toISOString(), last_error: null })
    .eq("event_id", eventId);
  if (sentError) throw Error("Meta conversion receipt requires retry.");
}
