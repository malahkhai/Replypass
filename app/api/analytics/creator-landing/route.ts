import { NextResponse } from "next/server";
import { recordCreatorLandingLoad } from "@/lib/analytics/landing-count";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { campaignFromSearch } from "@/lib/analytics/campaign";

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    const limited = await enforceRateLimit(request, "landingView");
    if (limited) return limited;
    if (Number(request.headers.get("content-length") || 0) > 512)
      return NextResponse.json({ error: "Invalid campaign." }, { status: 400 });
    const body = await request.json().catch(() => null);
    const campaign = body && typeof body === "object"
      ? campaignFromSearch(new URLSearchParams({
          utm_source: String(body.source || ""),
          utm_medium: String(body.medium || ""),
          utm_campaign: String(body.campaign || ""),
        }).toString()) : null;
    await recordCreatorLandingLoad(campaign);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Landing count unavailable." }, { status: 503 });
  }
}
