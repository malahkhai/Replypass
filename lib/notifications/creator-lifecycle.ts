import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";
import { notifyOnce } from "./service";
import { sendTransactionalEmail, type EmailTemplate } from "@/lib/email/service";
import { captureException } from "@/lib/observability/log";

const events: Record<string, { title: string; template: EmailTemplate }> = {
  profile_published: { title: "A creator published their profile", template: "creator_published" },
  replies_enabled: { title: "A creator enabled Guaranteed Replies", template: "creator_replies_enabled" },
  vip_enabled: { title: "A creator enabled VIP", template: "creator_vip_enabled" },
};
// Durable database events survive provider failures. Every recipient/channel has
// an idempotency key, so retries do not repeat successful notifications.
export async function deliverCreatorAdminEvents() {
  const db = serviceDatabase();
  const { data: pending, error } = await db.from("creator_admin_events").select("id,creator_id,event").is("processed_at", null).order("created_at").limit(2);
  if (error) throw error;
  if (!pending?.length) return;
  const { data: admins, error: adminError } = await db.from("profiles").select("id").eq("role", "admin").eq("account_status", "active");
  if (adminError) throw adminError;
  if (!admins?.length) throw Error("No active administrator for creator notifications.");
  for (const event of pending) {
    const copy = events[event.event];
    if (!copy) throw Error("Unknown creator event.");
    const { data: creator, error: creatorError } = await db.from("creator_profiles").select("handle").eq("id", event.creator_id).single();
    if (creatorError) throw creatorError;
    for (const admin of admins) {
      const key = `creator:${event.id}:admin:${admin.id}`;
      const path = `/admin/creators?creator=${event.creator_id}`;
      await notifyOnce({ recipientId: admin.id, eventKey: key, kind: "system", title: copy.title, body: `@${creator.handle} · No routine approval is needed. Open their admin record to review or manage the account.`, deepLink: path });
      const { data: auth, error: authError } = await db.auth.admin.getUserById(admin.id);
      if (authError || !auth.user?.email) throw Error("Administrator email unavailable.");
      const sent = await sendTransactionalEmail({ recipientId: admin.id, to: auth.user.email, template: copy.template, eventKey: key, link: `https://getreplypass.com${path}` });
      if (!["sent", "duplicate"].includes(sent.status)) throw Error("Creator notification email needs retry.");
    }
    const { error: doneError } = await db.from("creator_admin_events").update({ processed_at: new Date().toISOString() }).eq("id", event.id);
    if (doneError) throw doneError;
  }
}
export async function tryDeliverCreatorAdminEvents() {
  try { await deliverCreatorAdminEvents(); }
  catch (error) { captureException(error, { event: "creator_admin_notification", status: "failed" }); }
}
