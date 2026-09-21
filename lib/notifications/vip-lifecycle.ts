import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { sendTransactionalEmail, type EmailTemplate } from "@/lib/email/service";
import { notifyOnce } from "./service";
import { captureException } from "@/lib/observability/log";

type VipEvent = "started" | "payment_issue" | "canceled" | "creator_started" | "creator_payment";

export async function notifyVipLifecycle(
  membershipId: string,
  event: VipEvent,
  occurrence: string = event,
) {
  try {
    const db = serviceDatabase();
    const { data: membership } = await db
      .from("subscriptions")
      .select("fan_id,creator_id")
      .eq("id", membershipId)
      .single();
    if (!membership) return;
    const { data: creator } = await db
      .from("creator_profiles")
      .select("profile_id")
      .eq("id", membership.creator_id)
      .single();
    if (!creator) return;
    const creatorEvent = event === "creator_payment" || event === "creator_started";
    const recipientId = creatorEvent ? creator.profile_id : membership.fan_id;
    const template: EmailTemplate = event === "creator_started"
      ? "vip_member_started"
      : event === "creator_payment"
        ? "payment_completed"
      : event === "started"
        ? "vip_started"
        : event === "payment_issue"
          ? "vip_payment_issue"
          : "vip_canceled";
    const title = event === "creator_started"
      ? "You have a new VIP member"
      : event === "creator_payment"
        ? "Your VIP earning was recorded"
      : event === "started"
        ? "Your VIP membership is active"
        : event === "payment_issue"
          ? "Your VIP payment needs attention"
          : "Your VIP membership was canceled";
    const deepLink = event === "creator_started" ? "/creator/vip/subscribers" : creatorEvent ? "/creator/earnings" : "/account/subscriptions";
    const eventKey = `vip:${membershipId}:${event}:${occurrence}`;
    const { data: preferences } = await db
      .from("notification_preferences")
      .select("email_payments,email_subscriptions,in_app_enabled")
      .eq("profile_id", recipientId)
      .maybeSingle();
    if (preferences?.in_app_enabled !== false)
      await notifyOnce({
        recipientId,
        eventKey,
        kind: creatorEvent ? "payment" : "subscription",
        title,
        body: event === "creator_started"
          ? "A fan joined your ReplyPass VIP membership."
          : creatorEvent
          ? "A VIP payment has been added to your earnings."
          : "Open ReplyPass to review your membership.",
        deepLink,
      });
    const emailAllowed = event === "creator_started"
      ? preferences?.email_subscriptions !== false
      : creatorEvent
      ? preferences?.email_payments !== false
      : preferences?.email_subscriptions !== false;
    if (!emailAllowed) return;
    const { data: auth } = await db.auth.admin.getUserById(recipientId);
    if (!auth.user?.email) return;
    await sendTransactionalEmail({
      recipientId,
      to: auth.user.email,
      template,
      eventKey,
      link: `https://getreplypass.com${deepLink}`,
    });
  } catch (error) {
    captureException(error, {
      event: "vip_notification",
      subject_id: membershipId,
      status: event,
    });
  }
}
