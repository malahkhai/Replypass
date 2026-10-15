import { NextResponse } from "next/server";
import { recordCreatorLandingLoad } from "@/lib/analytics/landing-count";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    const limited = await enforceRateLimit(request, "landingView");
    if (limited) return limited;
    await recordCreatorLandingLoad();
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Landing count unavailable." }, { status: 503 });
  }
}
