import "server-only";
import type { FeaturedCreator } from "@/components/landing-options";
import { getVipPlan } from "@/lib/vip/server";
import { findCreator } from "./repository";

/** The saved portrait keeps the page useful when profile data is briefly unavailable. */
export async function getFeaturedMimi(): Promise<FeaturedCreator> {
  const creator = await findCreator("mimi").catch(() => null);
  if (!creator) return {
    name: "Mimi_Kiki",
    handle: "mimi",
    photo: "/images/mimi-feature.webp",
    categories: ["Creator", "Model", "Athlete"],
    messagePriceCents: null,
    vipPriceCents: null,
    live: false,
  };

  let vipPriceCents: number | null = null;
  if (creator.payoutReady) {
    try {
      const plan = await getVipPlan(creator.id);
      if (plan?.enabled) vipPriceCents = plan.amountCents;
    } catch { /* A VIP lookup failure should not break the homepage. */ }
  }
  const firstPhoto = creator.profilePhotos?.[0];
  return {
    name: creator.name,
    handle: creator.handle,
    photo: firstPhoto?.url || creator.image || "/images/mimi-feature.webp",
    photoPosition: firstPhoto ? `${firstPhoto.x}% ${firstPhoto.y}%` : "center",
    categories: creator.categories,
    messagePriceCents: creator.offerings.find((offer) => offer.kind === "message")?.cents ?? null,
    vipPriceCents,
    live: true,
  };
}
