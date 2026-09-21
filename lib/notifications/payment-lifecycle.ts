import "server-only";
import type { ReplyPayment } from "@/lib/stripe/engine";
import { serviceDatabase } from "@/lib/stripe/server";
import { sendTransactionalEmail, type EmailTemplate } from "@/lib/email/service";
import { captureException } from "@/lib/observability/log";
import { notifyOnce, type NotificationInput } from "./service";

type Event = "authorized" | "accepted" | "declined" | "expired" | "completed";

export async function notifyPaymentLifecycle(payment: ReplyPayment, event: Event) {
  try {
    const db = serviceDatabase();
    const { data: creator } = await db
      .from("creator_profiles")
      .select("profile_id")
      .eq("id", payment.creator_id)
      .single();
    if (!creator) return;
    const target = event === "authorized" ? creator.profile_id : payment.fan_id;
    const { data: preferences } = await db
      .from("notification_preferences")
      .select("email_requests,email_payments,in_app_enabled")
      .eq("profile_id", target)
      .maybeSingle();
    const requestLink = event === "authorized" ? "/creator/requests" : "/account/requests";
    const template: EmailTemplate =
      event === "authorized"
        ? "creator_request_received"
        : event === "accepted"
          ? "request_accepted"
          : event === "declined"
            ? "request_declined"
            : event === "expired"
              ? "request_expired"
              : payment.interaction_kind === "voice_note"
                ? "voice_ready"
                : payment.interaction_kind === "photo"
                  ? "photo_ready"
                  : "reply_completed";
    const copy: Record<Event, Pick<NotificationInput, "kind" | "title" | "body">> = {
      authorized: { kind: "request", title: "A new paid request is waiting", body: "Review it before the acceptance deadline." },
      accepted: { kind: "request", title: "Your request was accepted", body: "The creator is preparing your reply." },
      declined: { kind: "payment", title: "Your request was declined", body: "Your payment authorization is being released." },
      expired: { kind: "payment", title: "Your request expired", body: "You were not charged." },
      completed: { kind: "message", title: payment.interaction_kind === "voice_note" ? "Your voice note is ready" : payment.interaction_kind === "photo" ? "Your photo is ready" : "Your reply is ready", body: "Open ReplyPass to view your completed request." },
    };
    const eventKey = `payment:${payment.id}:${event}`;
    if (preferences?.in_app_enabled !== false)
      await notifyOnce({ recipientId: target, eventKey, deepLink: requestLink, ...copy[event] });
    const emailAllowed = event === "completed" ? preferences?.email_payments !== false : preferences?.email_requests !== false;
    if (emailAllowed) {
      const { data: auth } = await db.auth.admin.getUserById(target);
      if (auth.user?.email)
        await sendTransactionalEmail({
          recipientId: target,
          to: auth.user.email,
          template,
          eventKey,
          link: `https://getreplypass.com${requestLink}`,
        });
    }
    if (event === "completed") {
      const creatorKey = `payment:${payment.id}:earning`;
      const { data: creatorPreferences } = await db
        .from("notification_preferences")
        .select("email_payments,in_app_enabled")
        .eq("profile_id", creator.profile_id)
        .maybeSingle();
      if (creatorPreferences?.in_app_enabled !== false)
        await notifyOnce({
          recipientId: creator.profile_id,
          eventKey: creatorKey,
          kind: "payment",
          title: "Your earning was recorded",
          body: "A completed request has been added to your earnings.",
          deepLink: "/creator/earnings",
        });
      const { data: creatorAuth } = await db.auth.admin.getUserById(creator.profile_id);
      if (creatorPreferences?.email_payments !== false && creatorAuth.user?.email)
        await sendTransactionalEmail({
          recipientId: creator.profile_id,
          to: creatorAuth.user.email,
          template: "payment_completed",
          eventKey: creatorKey,
          link: "https://getreplypass.com/creator/earnings",
        });
    }
  } catch (error) {
    captureException(error, {
      event: "payment_notification",
      transaction_id: payment.id,
      status: event,
    });
  }
}
