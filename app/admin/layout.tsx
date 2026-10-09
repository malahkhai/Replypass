import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin-shell";
import "./admin.css";
export const dynamic = "force-dynamic";
export const metadata={title:"Admin",robots:{index:false,follow:false}};
export default async function Layout({children}:{children:React.ReactNode}){await requireAdmin("/admin");return <AdminShell>{children}</AdminShell>}
