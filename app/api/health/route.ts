import { productionReadiness } from "@/lib/config/production";
export const dynamic = "force-dynamic";
export async function GET() {
  const readiness = productionReadiness();
  return Response.json(
    { status: readiness.ok ? "ok" : "degraded" },
    { status: readiness.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
