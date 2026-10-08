import { socialAudience, type FollowerCounts, type SocialPlatform } from "@/lib/creators/socials";

function SocialPlatformIcon({ platform }: { platform: SocialPlatform }) {
  const paths: Record<SocialPlatform, React.ReactNode> = {
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></>,
    tiktok: <path d="M14 3v11.1a4.3 4.3 0 1 1-4.3-4.3M14 3c.6 3.2 2.7 5.2 6 5.4" />,
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" /></>,
    twitter: <path d="M4 3h3.5L20 21h-3.5L4 3Zm16 0L4 21" />,
    website: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[platform]}</svg>;
}
export function CreatorSocials({ socials, counts, updatedAt }: {
  socials: Partial<Record<SocialPlatform, string>>;
  counts?: FollowerCounts;
  updatedAt?: string | null;
}) {
  const { links, total, counted } = socialAudience(socials, counts);
  if (!links.length) return null;
  const date = updatedAt && Number.isFinite(Date.parse(updatedAt)) ? new Date(updatedAt) : null;
  return <section className="creator-socials" aria-label="Social links and audience">
    {counted > 0 && <div className="creator-audience">
      <strong>{new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(total)}</strong>
      <span>followers across {counted} {counted === 1 ? "account" : "accounts"}</span>
    </div>}
    <nav className="creator-social-links" aria-label="Creator social profiles">
      {links.map(link => <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer me" aria-label={`${link.label}${link.count !== undefined ? ` · ${link.count.toLocaleString("en-GB")} followers` : ""} (opens in a new tab)`}>
        <SocialPlatformIcon platform={link.platform} />
      </a>)}
    </nav>
    {counted > 0 && <p className="creator-audience-note">Creator-provided counts{date && <> · Updated <time dateTime={date.toISOString()}>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></>}. Audiences may overlap.</p>}
  </section>;
}
