import Link from "next/link";
import { AdminHeading } from "@/components/admin-ui";

export default function Page() {
  return <><AdminHeading eyebrow="REQUEST OPERATIONS" title="Requests" description="Paid requests and their charge, refund and transfer states are managed in Payments." /><section className="admin-card"><h2>Open the payments queue</h2><p>Use the payment record to inspect a request and its Stripe identifiers.</p><Link className="admin-secondary-link" href="/admin/payments">Open payments →</Link></section></>;
}
