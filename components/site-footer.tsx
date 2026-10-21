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
function SocialIcon({ name }: { name: "Instagram" | "X" }) {
  return name === "Instagram" ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.7 5.6 22H2.4l7.3-8.5L1.9 2h6.4l4.4 6.7L18.9 2Zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20Z" />
    </svg>
  );
}
function FooterLinks() {
  return <div className="footer-links">
    <nav className="footer-legal" aria-label="Legal and community">
      <Link href="/">About ReplyPass</Link>
      {trustLinks.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
    <nav className="footer-social" aria-label="ReplyPass social profiles">
      {socialLinks.map(([href, label]) => (
        <a key={href} href={href} aria-label={`ReplyPass on ${label}`} rel="me noopener noreferrer" target="_blank"><SocialIcon name={label} /></a>
      ))}
    </nav>
  </div>;
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>{siteConfig.name} · {siteConfig.tagline}</p>
      <div className="footer-desktop"><FooterLinks /></div>
      <details className="footer-details">
        <summary>About &amp; policies</summary>
        <FooterLinks />
      </details>
    </footer>
  );
}
