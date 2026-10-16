import { getViewer } from "@/lib/auth/session";
import { readJson, fail } from "@/lib/http";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sendCreatorSetupEmail } from "@/lib/notifications/creator-onboarding";
import { auditAdmin } from "@/lib/admin/repository";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer || viewer.demo || viewer.role !== "admin") return fail("Admin required.", 403);
  const limited = await enforceRateLimit(request, "admin", viewer.id);
  if (limited) return limited;
  try {
    const { action } = await readJson(request);
    if (action !== "send_setup") return fail("Invalid action.");
    const { id } = await params;
    const outcome = await sendCreatorSetupEmail(id, "welcome");
    if (outcome === "ineligible") return fail("This creator cannot receive a setup email.", 409);
    if (outcome === "failed" || outcome === "skipped") return fail("Email delivery needs retry.", 503);
    if (outcome === "sent") await auditAdmin(viewer.id, "creator.setup_email_sent", "profile", id);
    return Response.json({ status: outcome });
  } catch {
    return fail("Setup email could not be sent.", 503);
  }
}
