import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { stripeConfig } from "@/lib/stripe/config";
import { paymentSummaries } from "@/lib/stripe/summaries";
import { FanRequestCard } from "@/components/fan-request-card";
import { Icon } from "@/components/icon";

export const metadata = { title: "Your deliveries", robots: { index: false, follow: false } };

export default async function Page() {
  const viewer = await requireRole(["fan", "creator", "admin"]);
  const rows = !viewer.demo && stripeConfig()
    ? (await paymentSummaries(viewer.id, "fan")).filter((item) => ["voice_note", "photo"].includes(item.interaction_kind) && item.payment_state === "captured")
    : [];
  return <main id="main" className="fan-account fan-requests-page">
    <section className="fan-requests-heading"><div><span className="eyebrow">PRIVATE DELIVERIES</span><h1>Your personal collection.</h1><p>Voice notes and photos delivered securely by your creators.</p></div><Link className="button button-secondary" href="/account/requests">All requests</Link></section>
    <section className="fan-request-list" aria-label="Completed paid deliveries">{rows.map((request)=><FanRequestCard key={request.id} request={request}/>)}</section>
    {!rows.length && <div className="fan-requests-empty"><Icon name="lock" size={28}/><h2>No deliveries yet.</h2><p>Completed voice notes and personal photos will appear here.</p><Link className="button button-primary" href="/account">Back to messages</Link></div>}
  </main>;
}
