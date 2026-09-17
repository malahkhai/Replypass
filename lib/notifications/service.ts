import "server-only";
import { serviceDatabase } from "@/lib/stripe/server";

export type NotificationInput = {
  recipientId: string;
  eventKey: string;
  kind: "request" | "message" | "payment" | "subscription" | "system";
  title: string;
  body?: string;
  deepLink?: string;
};

export async function notifyOnce(input: NotificationInput) {
  if (!/^\/[a-zA-Z0-9@_/?=&.%-]*$/.test(input.deepLink || "/")) throw Error("Invalid notification link.");
  const db = serviceDatabase();
  const { data, error } = await db.from("notifications").upsert({
    recipient_id: input.recipientId,
    event_key: input.eventKey,
    kind: input.kind,
    title: input.title.slice(0, 120),
    body: input.body?.slice(0, 300) || null,
    deep_link: input.deepLink || null,
  }, { onConflict: "recipient_id,event_key", ignoreDuplicates: true }).select("id").maybeSingle();
  if (error) throw Error("Notification could not be recorded.");
  return data?.id || null;
}
