import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { serviceDatabase } from "@/lib/stripe/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
    const limited = await enforceRateLimit(request, "auth");
    if (limited) return limited;
    const body = await request.json();
    if (typeof body.creatorId !== "string" || !uuid.test(body.creatorId))
      return NextResponse.json({ error: "Creator link required." }, { status: 400 });
    const db = serviceDatabase();
    await db.from("fan_signup_tokens").delete()
      .lt("expires_at", new Date(Date.now() - 86400000).toISOString());
    const { data: creator, error: creatorError } = await db.from("creator_profiles")
      .select("id").eq("id", body.creatorId).eq("status", "approved")
      .eq("onboarding_complete", true).maybeSingle();
    if (creatorError || !creator)
      return NextResponse.json({ error: "Creator link unavailable." }, { status: 404 });
    const { data, error } = await db.from("fan_signup_tokens")
      .insert({ creator_id: creator.id }).select("token").single();
    if (error || !data)
      return NextResponse.json({ error: "Could not start fan signup." }, { status: 503 });
    return NextResponse.json({ token: data.token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not start fan signup." }, { status: 503 });
  }
}
