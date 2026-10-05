"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site";
import { Icon } from "@/components/icon";
import { isCreatorProfilePath } from "@/lib/creators/paths";
export function Logo() {
  const pathname = usePathname();
  const creator = isCreatorProfilePath(pathname);
  return (
    <a
      href={creator ? `${pathname}#main` : "/"}
      className="logo"
      aria-label={
        creator
          ? `Back to @${pathname.slice(1).replace(/^@/, "")} profile`
          : `${siteConfig.name} home`
      }
    >
      {siteConfig.logo}
      <span className="logo-dot">.</span>
    </a>
  );
}
export function HeaderLinks({ role }: { role: string | null }) {
  const path = usePathname();
  const login = isCreatorProfilePath(path)
    ? `/login?next=${encodeURIComponent(path)}`
    : "/login";
  return (
    <nav aria-label="Main navigation">
      <Link href="/creators" className="creator-link">
        Become a creator <Icon name="arrow" size={16} />
      </Link>
      <Link
        className="login-link"
        href={
          role
            ? role === "creator" || role === "admin"
              ? "/creator/dashboard"
              : "/account"
            : login
        }
      >
        {role ? "My ReplyPass" : "Log in"}
        <Icon name="user" size={15} />
      </Link>
    </nav>
  );
}
