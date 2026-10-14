import Link from "next/link";

const sections = [
  { href: "/account", label: "Overview" },
  { href: "/account/requests", label: "Requests" },
  { href: "/account/subscriptions", label: "Memberships" },
  { href: "/account/deliveries", label: "Deliveries" },
  { href: "/account#saved-creators", label: "Saved creators" },
];

export function FanPageNav({ current }: { current: string }) {
  return (
    <>
    <nav className="fan-page-nav" aria-label="Fan account">
      <Link className="fan-page-nav-home" href="/account">← <span>My ReplyPass</span></Link>
      <div className="fan-page-nav-links">
        {sections.filter((section) => section.label !== current).map((section) => (
          <Link key={section.href} href={section.href}>{section.label}</Link>
        ))}
      </div>
    </nav>
    <nav className="fan-mobile-nav" aria-label="Fan mobile navigation">
      {[{ href: "/account", label: "Home" }, { href: "/account/requests", label: "Requests" }, { href: "/account/subscriptions", label: "VIP" }, { href: "/account#saved-creators", label: "Creators" }].map(item => <Link key={item.href} href={item.href} aria-current={item.label === current || item.label === "VIP" && current === "Memberships" ? "page" : undefined}>{item.label}</Link>)}
    </nav>
    </>
  );
}
