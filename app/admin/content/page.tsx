import Link from "next/link";
import { AdminHeading } from "@/components/admin-ui";

export default function Page() {
  return <><AdminHeading eyebrow="MODERATION" title="Content" description="Reported messages, deliveries and VIP posts are reviewed in Reports." /><section className="admin-card"><h2>Open the reports queue</h2><p>Review reported content and record moderation decisions there.</p><Link className="admin-secondary-link" href="/admin/reports">Open reports →</Link></section></>;
}
