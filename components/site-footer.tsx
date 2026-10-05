import Link from "next/link";
import { siteConfig } from "@/lib/site";
export const trustLinks = [
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  ["/community-guidelines", "Community guidelines"],
  ["/creator-terms", "Creator terms"],
] as const;
const socialLinks = [
  ["https://www.instagram.com/getreplypass/", "Instagram"],
  ["https://x.com/getreplypass", "X"],
] as const;
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        {siteConfig.name} · {siteConfig.tagline}
      </p>
      <nav aria-label="Legal and community">
        <Link href="/">About ReplyPass</Link>
        {trustLinks.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <nav aria-label="ReplyPass social profiles">
        {socialLinks.map(([href, label]) => (
          <a key={href} href={href} rel="me noopener noreferrer" target="_blank">
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
