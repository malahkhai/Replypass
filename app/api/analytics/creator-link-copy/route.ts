import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { serviceDatabase } from "@/lib/stripe/server";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== new URL(request.url).host)
      return NextResponse.json({ error: "Invalid origin." }, { status: 403 });

    const limited = await enforceRateLimit(request, "linkCopy");
    if (limited) return limited;

    const body = await request.json();
    if (typeof body.creatorId !== "string" || !uuid.test(body.creatorId))
      return NextResponse.json({ error: "Invalid creator." }, { status: 400 });
    if (!["creator_dashboard", "public_profile"].includes(body.surface))
      return NextResponse.json({ error: "Invalid copy source." }, { status: 400 });

    const db = serviceDatabase();
    const { data: creator, error: creatorError } = await db
      .from("creator_profiles")
      .select("id,profile_id,onboarding_complete,status")
      .eq("id", body.creatorId)
      .maybeSingle();
    if (creatorError || !creator?.onboarding_complete || creator.status !== "approved")
      return NextResponse.json({ error: "Creator unavailable." }, { status: 404 });

    if (body.surface === "creator_dashboard") {
      const viewer = await getViewer();
      if (!viewer || viewer.demo || viewer.role !== "creator" || viewer.id !== creator.profile_id)
        return NextResponse.json({ error: "Creator sign-in required." }, { status: 401 });
    }

    const { error } = await db.rpc("record_creator_link_copy", {
      target_creator: creator.id,
      copy_surface: body.surface,
    });
    if (error)
      return NextResponse.json({ error: "Link-copy count unavailable." }, { status: 503 });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Link-copy count unavailable." }, { status: 503 });
  }
}
