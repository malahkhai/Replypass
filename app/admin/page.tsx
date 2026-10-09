import Link from "next/link";
import { AdminEmpty, AdminHeading } from "@/components/admin-ui";
import { adminOverview } from "@/lib/admin/repository";

const attentionDestinations: Record<string, string> = {
  "Open reports": "/admin/reports",
  "Failed transfers": "/admin/payments",
  "Disputes": "/admin/disputes",
  "Reconciliation issues": "/admin/system/reconciliation",
};

export default async function Page() {
  const { metrics } = await adminOverview();
  const attention = metrics.filter(metric => metric.attention);
  const headline = ["Total users", "Active creators", "Gross payment volume", "Platform share before Stripe fees"];
  const topMetrics = headline.map(label => metrics.find(metric => metric.label === label)).filter(metric => metric !== undefined);
  const otherMetrics = metrics.filter(metric => !headline.includes(metric.label) && !metric.attention);

  return <>
    <AdminHeading eyebrow="OPERATIONS HOME" title="Overview" description="Start with items that need a decision, then open the relevant queue. Financial totals show ReplyPass records for the current Stripe mode." />

    <section className="admin-section" aria-labelledby="attention-heading">
      <div className="admin-section-title"><h2 id="attention-heading">Needs attention</h2><Link href="/admin/launch-readiness">Launch readiness →</Link></div>
      {attention.length ? <div className="admin-attention-grid">{attention.map(metric => <Link href={attentionDestinations[metric.label] ?? "/admin/system"} key={metric.label}><span>{metric.value}</span><strong>{metric.label}</strong><small>Open queue →</small></Link>)}</div> : <AdminEmpty>No open reports, disputes, failed transfers or reconciliation issues in the current view.</AdminEmpty>}
    </section>

    <section aria-labelledby="activity-heading">
      <div className="admin-section-heading"><div><h2 id="activity-heading">At a glance</h2><p>Counts and amounts from ReplyPass records. The platform share is before Stripe processing and other costs.</p></div></div>
      <div className="admin-metrics">{topMetrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}</div>
    </section>

    <section className="admin-link-grid" aria-label="Common admin tasks">
      <Link href="/admin/creators"><strong>Creators</strong><span>Profiles, payout eligibility and link-copy activity →</span></Link>
      <Link href="/admin/payments"><strong>Payments</strong><span>Charges, transfers, refunds and failed transfers →</span></Link>
      <Link href="/admin/subscriptions"><strong>Subscriptions</strong><span>VIP membership status and Stripe IDs →</span></Link>
      <Link href="/admin/system"><strong>System</strong><span>Reconciliation, delivery checks and background jobs →</span></Link>
    </section>

    <details className="readiness-details"><summary>More platform metrics</summary><div className="readiness-details-body"><div className="admin-metrics admin-metrics-secondary">{otherMetrics.map(metric => <article key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></article>)}</div></div></details>
  </>;
}
