"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./navigation";
import { LogoutButton } from "./logout-button";

const groups: { label: string; links: [string, string][] }[] = [
  { label: "Home", links: [["Overview", "/admin"], ["Launch readiness", "/admin/launch-readiness"]] },
  { label: "Money", links: [["Payments", "/admin/payments"], ["Payouts", "/admin/payouts"], ["Subscriptions", "/admin/subscriptions"], ["Reconciliation", "/admin/system/reconciliation"]] },
  { label: "People & safety", links: [["Creators", "/admin/creators"], ["Users", "/admin/users"], ["Reports", "/admin/reports"], ["Disputes", "/admin/disputes"]] },
  { label: "Operations", links: [["System", "/admin/system"], ["Notifications", "/notifications"]] },
];

function isCurrent(path: string, href: string) {
  return path === href || (href !== "/admin" && href !== "/admin/system" && path.startsWith(`${href}/`));
}

function AdminNav({ path }: { path: string }) {
  return <nav className="admin-nav" aria-label="Admin navigation">
    {groups.map(group => <div className="admin-nav-group" key={group.label}>
      <span className="admin-nav-label">{group.label}</span>
      {group.links.map(([name, href]) => <Link key={href} href={href} aria-current={isCurrent(path, href) ? "page" : undefined}>{name}</Link>)}
    </div>)}
  </nav>;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const current = groups.flatMap(group => group.links).find(([, href]) => isCurrent(path, href))?.[0] ?? "Operations";
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="admin-brand"><Logo /><span>ADMIN CONSOLE</span></div>
      <AdminNav path={path} />
      <div className="admin-sidebar-bottom"><Link href="/">View public site ↗</Link><LogoutButton /></div>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <div><span className="admin-topbar-kicker">ReplyPass / Admin</span><strong>{current}</strong></div>
        <div className="admin-topbar-actions"><Link href="/">View site ↗</Link><details className="admin-mobile-menu"><summary>Menu</summary><AdminNav path={path} /><LogoutButton /></details></div>
      </header>
      <main id="main" className="admin-content">{children}</main>
    </div>
  </div>;
}
