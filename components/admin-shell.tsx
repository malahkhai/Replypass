"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./navigation";
import { LogoutButton } from "./logout-button";

const links=[
  ["Overview","/admin"],["Users","/admin/users"],["Creators","/admin/creators"],
  ["Payments","/admin/payments"],["Subscriptions","/admin/subscriptions"],["Payouts","/admin/payouts"],
  ["Requests","/admin/requests"],["Reports","/admin/reports"],["Disputes","/admin/disputes"],
  ["Content","/admin/content"],["System","/admin/system"],
] as const;
export function AdminShell({children}:{children:React.ReactNode}){
 const path=usePathname();
 return <div className="admin-shell"><aside className="admin-sidebar"><Logo/><span className="sidebar-label">INTERNAL OPERATIONS</span><nav aria-label="Admin navigation">{links.map(([name,href])=><Link key={href} href={href} aria-current={path===href||href!=="/admin"&&path.startsWith(href)?"page":undefined}>{name}</Link>)}</nav><LogoutButton/></aside><div className="admin-main"><header><strong>ReplyPass operations</strong><span>Authorized administrators only</span></header><main id="main">{children}</main></div></div>;
}
