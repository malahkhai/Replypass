export const socialPlatforms = {
  instagram: { label: "Instagram", domains: ["instagram.com"] },
  tiktok: { label: "TikTok", domains: ["tiktok.com"] },
  youtube: { label: "YouTube", domains: ["youtube.com", "youtu.be"] },
  twitter: { label: "X", domains: ["x.com", "twitter.com"] },
  website: { label: "Website", domains: [] },
} as const;
export type SocialPlatform = keyof typeof socialPlatforms;
export type FollowerCounts = Partial<Record<Exclude<SocialPlatform, "website">, number>>;
export function safeSocialUrl(platform: SocialPlatform, value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const domains: readonly string[] = socialPlatforms[platform].domains;
    return !domains.length || domains.some(d => url.hostname === d || url.hostname.endsWith(`.${d}`)) ? url.href : null;
  } catch { return null; }
}
export function validFollowerCounts(value: unknown): value is FollowerCounts {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.entries(value).every(([key, count]) => key !== "website" && Object.hasOwn(socialPlatforms, key) &&
      typeof count === "number" && Number.isSafeInteger(count) && count >= 0 && count <= 2_000_000_000);
}
export function socialAudience(socials: Partial<Record<SocialPlatform, string>>, counts: FollowerCounts = {}) {
  const links = (Object.keys(socialPlatforms) as SocialPlatform[]).flatMap(platform => {
    const href = safeSocialUrl(platform, socials[platform] || "");
    if (!href) return [];
    const count = platform === "website" ? undefined : counts[platform];
    return [{ platform, label: socialPlatforms[platform].label, href,
      count: Number.isSafeInteger(count) && count! >= 0 && count! <= 2_000_000_000 ? count : undefined }];
  });
  const counted = links.filter(link => link.count !== undefined);
  return { links, total: counted.reduce((sum, link) => sum + link.count!, 0), counted: counted.length };
}
