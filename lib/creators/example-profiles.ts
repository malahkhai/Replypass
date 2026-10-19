import { blankCreator, toPublic } from "./catalog";
import type { PublicCreator } from "@/types/creator";

type ExampleProfile = {
  slug: "musician" | "dj";
  label: string;
  creator: PublicCreator;
};

export const exampleProfiles: ExampleProfile[] = [
  {
    slug: "musician",
    label: "Musician",
    creator: toPublic({
      ...blankCreator,
      displayName: "Luna Vale",
      username: "example_musician",
      image: "/images/demo-musician.webp",
      bio: "Songs in progress, stories behind the music, and a closer place to talk about both.",
      categories: ["Musician", "Creator"],
      country: "GB",
      pricing: blankCreator.pricing.map((item) => ({
        ...item,
        cents: item.kind === "message" ? 1200 : item.kind === "vip" ? 900 : item.cents,
        enabled: item.kind === "message" || item.kind === "vip",
      })),
      acceptingMedia: false,
      availability: "online",
    }),
  },
  {
    slug: "dj",
    label: "DJ",
    creator: toPublic({
      ...blankCreator,
      displayName: "Nico Reyes",
      username: "example_dj",
      image: "/images/demo-dj.webp",
      bio: "Sets, sounds and late nights. Ask me about the music, or come behind the scenes.",
      categories: ["DJ", "Musician"],
      country: "FR",
      pricing: blankCreator.pricing.map((item) => ({
        ...item,
        cents: item.kind === "message" ? 800 : item.kind === "vip" ? 1500 : item.cents,
        enabled: item.kind === "message" || item.kind === "vip",
      })),
      acceptingMedia: false,
      availability: "online",
    }),
  },
];

export function findExampleProfile(slug: string) {
  return exampleProfiles.find((profile) => profile.slug === slug) ?? null;
}
