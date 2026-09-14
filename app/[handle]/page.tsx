import { getViewer } from "@/lib/auth/session";
import { stripeConfig } from "@/lib/stripe/config";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { notFound } from "next/navigation";
import { CreatorProfile } from "@/components/creator-profile";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { findCreator } from "@/lib/creators/repository";
import { getVipPlan, hasActiveVipAccess } from "@/lib/vip/server";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const creator = await findCreator((await params).handle);
  if (!creator)
    return {
      title: "Creator not found",
      robots: { index: false, follow: false },
    };
  return pageMetadata(
    creator.name,
    `/${creator.handle}`,
    `${creator.name} on ${siteConfig.name}. ${siteConfig.tagline} ${siteConfig.fanPromise}`,
  );
}
export default async function Profile({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ interaction?: string }>;
}) {
  const { handle } = await params;
  const { interaction } = await searchParams;
  let decoded = "";
  try {
    decoded = decodeURIComponent(handle);
  } catch {
    notFound();
  }
  if (!decoded.startsWith("@")) notFound();
  const creator = await findCreator(handle);
  if (!creator) notFound();
  const viewer = await getViewer();
  let vipPlan = null, activeVip = false;
  if (!creator.demo) {
    try { vipPlan = await getVipPlan(creator.id); activeVip = !!viewer && !viewer.demo && await hasActiveVipAccess(viewer.id, creator.id); } catch {}
  }
  const presentedCreator = creator.demo ? creator : { ...creator, vip: vipPlan?.enabled ? { kind: "vip" as const, title: "Join VIP", subtitle: vipPlan.description, cents: vipPlan.amountCents, unit: "/month", icon: "sparkles" } : null };
  return (
    <>
      {!creator.demo && <ProfileViewTracker creatorId={creator.id} />}
      <CreatorProfile
        key={`${handle}:${interaction || ""}`}
        initialInteraction={interaction}
        creator={presentedCreator}
        authenticated={!!viewer}
        vipPlan={vipPlan}
        activeVip={activeVip}
        paymentsEnabled={!!stripeConfig() && !creator.demo}
      />
    </>
  );
}
