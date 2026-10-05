import { socialAudience, type FollowerCounts, type SocialPlatform } from "@/lib/creators/socials";
import { Icon } from "./icon";
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
    <div className="creator-social-links">
      {links.map(link => <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer me" aria-label={`${link.label}${link.count !== undefined ? ` · ${link.count.toLocaleString("en-GB")} followers` : ""} (opens in a new tab)`}>
        <span>{link.label}</span>
        {link.count !== undefined && <small>{new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(link.count)}</small>}
        <Icon name="arrow" size={14} />
      </a>)}
    </div>
    {counted > 0 && <p className="creator-audience-note">Creator-provided counts{date && <> · Updated <time dateTime={date.toISOString()}>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></>}. Audiences may overlap.</p>}
  </section>;
}
