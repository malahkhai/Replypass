import { getViewer } from "@/lib/auth/session";
import { reportException } from "@/lib/observability/provider";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { sameOrigin, fail } from "@/lib/http";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Invalid origin.", 403);
  const viewer = await getViewer();
  if (!viewer || viewer.demo || viewer.role !== "admin") return fail("Admin required.", 403);
  const limited = await enforceRateLimit(request, "admin", viewer.id);
  if (limited) return limited;
  const accepted = await reportException(new Error("Operational test"), {
    event: "monitoring_test", route: "/api/admin/system/test-monitoring", status: "test",
  });
  return Response.json({ accepted }, { status: accepted ? 200 : 503 });
}
