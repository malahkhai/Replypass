import { getViewer } from "@/lib/auth/session";
import { serviceDatabase } from "@/lib/stripe/server";
import { sendTransactionalEmail } from "@/lib/email/service";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sameOrigin, fail } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || viewer.role !== "admin") return fail("Admin required.", 403);
  const limited = await enforceRateLimit(request, "admin", viewer.id);
  if (limited) return limited;
  const { data } = await serviceDatabase().auth.admin.getUserById(viewer.id);
  if (!data.user?.email) return fail("Account email unavailable.", 409);
  const result = await sendTransactionalEmail({recipientId: viewer.id, to: data.user.email, template: "operational_test", eventKey: `email-test:${viewer.id}:${new Date().toISOString().slice(0,10)}`, link: "https://getreplypass.com/admin/system"});
  return Response.json({status: result.status}, {status: result.status === "failed" ? 503 : 200});
}
