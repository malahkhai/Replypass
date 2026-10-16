import { timingSafeEqual } from "node:crypto";
import { deliverCreatorSetupReminders } from "@/lib/notifications/creator-onboarding";
import { captureException } from "@/lib/observability/log";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const received = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (!secret || secret.length < 32 || received.length !== expected.length ||
    !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const sent = await deliverCreatorSetupReminders();
    return Response.json({ sent }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    captureException(error, { event: "creator_setup_reminders", status: "failed" });
    return new Response("Retry required", { status: 503 });
  }
}
