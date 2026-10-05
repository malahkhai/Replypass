import { serviceDatabase } from "@/lib/stripe/server";
import { connectAccountTable } from "@/lib/stripe/account-table";
import { stripeConfig } from '@/lib/stripe/config';
import { connectStatus } from '@/lib/stripe/connect';
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { demoCreator } from "@/lib/auth/demo";
import { blankCreator, demoStella, toPublic } from "./catalog";
import type { CreatorDraft, PublicCreator } from "@/types/creator";

export function draftFromRow(
  row: Record<string, unknown>,
  profile: { display_name: string; avatar_path: string | null },
  pricing: {
    kind: CreatorDraft["pricing"][number]["kind"];
    amount_cents: number;
    active: boolean;
  }[],
): CreatorDraft {
  return {
    ...blankCreator,
    publicationStatus: String(row.status || "draft"),
    onboardingComplete: row.onboarding_complete === true,
    displayName: profile.display_name,
    username: String(row.handle),
    image: profile.avatar_path || "",
    bio: String(row.bio || ""),
    categories: row.categories as string[],
    country: String(row.country || "FR"),
    socials: { ...blankCreator.socials, ...(row.social_links as object) },
    socialFollowers: (row.social_followers || {}) as CreatorDraft["socialFollowers"],
    socialFollowersUpdatedAt: typeof row.social_followers_updated_at === "string" ? row.social_followers_updated_at : null,
    pricing: blankCreator.pricing.map((p) => {
      const saved = pricing.find((x) => x.kind === p.kind);
      return saved
        ? { kind: p.kind, cents: saved.amount_cents, enabled: saved.active }
        : { ...p, enabled: false };
    }),
    availability:
      (row.availability as CreatorDraft["availability"]) || "offline",
    acceptingMessages: row.accepting_messages === true,
    acceptingLive: row.accepting_live_chats === true,
    acceptingMedia: row.accepting_media_requests === true,
    replyTime: String(row.reply_time || ""),
  };
}
export async function creatorForUser(
  userId: string,
): Promise<CreatorDraft | null> {
  const supabase = await createClient();
  if (!supabase) return demoCreator();
  const { data: row, error } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw Error("Unable to load your creator profile.");
  if (!row) return null;
  const [
    { data: profile, error: pError },
    { data: prices, error: priceError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name,avatar_path")
      .eq("id", userId)
      .single(),
    supabase
      .from("creator_pricing")
      .select("kind,amount_cents,active")
      .eq("creator_id", row.id),
  ]);
  if (pError || priceError || !profile)
    throw Error("Unable to load creator settings.");
  const draft=draftFromRow(row, profile, prices || []);
  try {draft.payoutReady=!!stripeConfig() && (await connectStatus(row.id)).ready;} catch {draft.payoutReady=false;}
  return draft;
}
export async function findCreator(raw: string): Promise<PublicCreator | null> {
  let username: string;
  try {
    username = decodeURIComponent(raw).replace(/^@/, "");
  } catch {
    return null;
  }
  if (!/^[a-z0-9_]{3,30}$/.test(username)) return null;
  const supabase = await createClient();
  if (!supabase) {
    if (process.env.NODE_ENV === "production") return null;
    const own = await demoCreator();
    return username === own.username
      ? username === "stella"
        ? {
            ...demoStella,
            ...toPublic(own),
            verified: true,
            rating: "4.9",
            ratingCount: 1260,
            responseRate: "98%",
            responseTime: "~8 min",
            completedChats: "2.4K",
          }
        : toPublic(own)
      : username === "stella"
        ? demoStella
        : null;
  }
  try {
    const { data: row, error } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("handle", username)
      .eq("onboarding_complete", true)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw error;
    // Production only returns real approved creators.
    if (!row) return null;
    const [
      { data: profile, error: pError },
      { data: prices, error: priceError },
      { data: ratingSummary },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name,avatar_path")
        .eq("id", row.profile_id)
        .single(),
      supabase
        .from("creator_pricing")
        .select("kind,amount_cents,active")
        .eq("creator_id", row.id),
      supabase.rpc("creator_rating_summary", { creator: row.id }),
    ]);
    if (pError || priceError || !profile) throw Error();
    const result = toPublic(draftFromRow(row, profile, prices || []), false);
    const mode = stripeConfig()?.mode;
    let payoutReady = false;
    if (mode) {
      const { data: payout } = await serviceDatabase().from(connectAccountTable(mode)).select("ready").eq("creator_id", row.id).maybeSingle();
      payoutReady = payout?.ready === true;
    }
    return {
      ...result,
      id: row.id,
      payoutReady,
      offerings: payoutReady ? result.offerings : [],
      vip: payoutReady ? result.vip : null,
      verified: row.verified,
      responseRate: row.response_rate === null ? "—" : `${row.response_rate}%`,
      responseTime: row.reply_time || "Not set",
      completedChats: String(row.completed_chats),
      rating:
        ratingSummary?.[0]?.rating_count > 0
          ? Number(ratingSummary[0].average_score).toFixed(1)
          : "New",
      ratingCount: Number(ratingSummary?.[0]?.rating_count || 0),
    };
  } catch {
    return null;
  }
}
