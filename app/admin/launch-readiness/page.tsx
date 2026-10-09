import Link from "next/link";
import { AdminHeading, Status } from "@/components/admin-ui";
import { productionReadiness } from "@/lib/config/production";
import { serviceDatabase } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Launch readiness", robots: { index: false, follow: false } };

function completedRecently(value: string | null | undefined) {
  return !!value && Date.now() - Date.parse(value) < 15 * 60_000;
}

const priorities = [
  {
    title: "Confirm who can receive payouts",
    detail: "Check creator-country support and the France-to-US Connect transfer route with Stripe. A US fan payment and a US creator payout are separate checks.",
    href: "/admin/creators",
    action: "Review creators",
  },
  {
    title: "Prove a bank payout end to end",
    detail: "Use an eligible creator with accurate details. Confirm Stripe shows a settled payout to their bank, not only a transfer to their Stripe balance.",
    href: "/admin/payouts",
    action: "Open payouts",
  },
  {
    title: "Test no reply = no charge",
    detail: "Run a live decline and a cron-driven expiry. Confirm both authorizations release without a charge or creator earnings.",
    href: "/admin/payments",
    action: "Open payments",
  },
];

const gates = [
  { title: "Creator eligibility", detail: "The Nigeria onboarding reports and the test creator’s French account need review. Confirm supported countries and accurate account details with Stripe.", href: "/admin/creators", action: "Review creators" },
  { title: "Bank payout", detail: "A connected-account transfer was observed. A settled bank payout has not been evidenced.", href: "/admin/payouts", action: "Review payouts" },
  { title: "No reply = no charge", detail: "Test a live decline and an expired request. Both authorizations must be released without creator earnings.", href: "/admin/payments", action: "Review payments" },
  { title: "VIP billing lifecycle", detail: "Live subscription, renewal failure, cancellation and access removal remain unverified. The live VIP charge was deferred by the owner.", href: "/admin/subscriptions", action: "Review subscriptions" },
  { title: "Mobile checkout and wallets", detail: "Complete iPhone Safari, Instagram browser, Android Chrome and eligible Apple Pay/Google Pay journeys.", href: "/admin/system", action: "Review system" },
  { title: "Legal and operator review", detail: "Complete operator details and professional review of legal pages and checkout before public commercial launch.", href: "/admin/system", action: "Review system" },
];

export default async function Page() {
  const config = productionReadiness();
  const { data: runs, error } = await serviceDatabase()
    .from("operational_runs")
    .select("status,completed_at")
    .eq("job", "payments")
    .order("created_at", { ascending: false })
    .limit(1);
  const lastRun = error ? null : runs?.[0];
  const recentCron = lastRun?.status === "succeeded" && completedRecently(lastRun.completed_at);
  const checks = [
    { name: "Core configuration", configured: config.launchReady, detail: config.launchReady ? "Supabase, live Stripe, webhook and rate-limit settings are present. Live outcomes still need verification." : [...config.missing, ...config.blockers].join(", ") || "Configuration needs review." },
    { name: "Payment expiry job", configured: recentCron, detail: recentCron ? `Last successful run: ${new Date(lastRun.completed_at!).toLocaleString("en-GB")}` : "No successful run in the last 15 minutes. Check the scheduler and operational logs." },
    { name: "Email", configured: !!process.env.EMAIL_API_KEY && !!process.env.EMAIL_FROM, detail: "Settings present only; confirm an actual delivery in the provider and inbox." },
    { name: "Sentry", configured: !!process.env.ERROR_MONITORING_DSN, detail: "Settings present only; confirm an event and alert in Sentry." },
    { name: "GA4 and Meta", configured: process.env.NEXT_PUBLIC_GA_ENABLED === "true" && process.env.NEXT_PUBLIC_META_ENABLED === "true", detail: "Consent-gated settings only; confirm events in both dashboards." },
  ];

  return <>
    <AdminHeading eyebrow="CONTROLLED LAUNCH" title="Launch readiness" description="What has been observed, what still blocks launch, and where to go next. Last evidence review: 9 October 2026." />

    <section className="readiness-hero" aria-labelledby="launch-decision">
      <div><Status tone="warn">Launch blocked</Status><h2 id="launch-decision">Paid public launch is not verified yet.</h2><p>The live €4 charge, fan refund and full €3.40 creator transfer reversal now match in Stripe and ReplyPass. Creator eligibility, a settled bank payout and other live checks remain open.</p></div>
      <a className="admin-primary-link" href="#next-actions">See next actions ↓</a>
    </section>

    <div className="readiness-milestones" aria-label="Live payment milestones">
      <article className="readiness-milestone"><span>01 · Verified</span><strong>€4 charged</strong><p>Stripe and ReplyPass records match for the October Guaranteed Reply test.</p></article>
      <article className="readiness-milestone"><span>02 · Verified</span><strong>€4 refunded · €3.40 reversed</strong><p>Stripe issued the refund and fully reversed the creator transfer on 9 October. Card receipt may take several business days.</p></article>
      <article className="readiness-milestone open"><span>03 · Still open</span><strong>Bank payout</strong><p>No settled payout to the creator’s bank has been evidenced.</p></article>
    </div>

    <section id="next-actions" aria-labelledby="next-actions-heading">
      <div className="admin-section-heading"><div><h2 id="next-actions-heading">Do these next</h2><p>Complete these in order before another live payout test.</p></div></div>
      <div className="readiness-steps">{priorities.map((step, index) => <article className="readiness-step" key={step.title}><span className="readiness-step-number">{index + 1}</span><div><h3>{step.title}</h3><p>{step.detail}</p></div><Link href={step.href}>{step.action} →</Link></article>)}</div>
    </section>

    <section aria-labelledby="remaining-gates-heading">
      <div className="admin-section-heading"><div><h2 id="remaining-gates-heading">Remaining launch gates</h2><p>These need recorded real-world outcomes. A configured service does not mark a financial test complete.</p></div></div>
      <div className="readiness-gates">{gates.map(gate => <article className="readiness-gate" key={gate.title}><div><h3>{gate.title}</h3><Status tone="warn">Open</Status></div><p>{gate.detail}</p><Link href={gate.href}>{gate.action} →</Link></article>)}</div>
    </section>

    <details className="readiness-details"><summary>Technical setup checks · {checks.filter(check => check.configured).length} of {checks.length} configured</summary><div className="readiness-details-body"><p className="admin-note">“Configured” means the setting or recent job run is present; it does not certify delivery or payment settlement.</p><div className="readiness-config">{checks.map(check => <article key={check.name}><h3><Status tone={check.configured ? "good" : "warn"}>{check.configured ? "Configured" : "Check"}</Status> {check.name}</h3><p>{check.detail}</p></article>)}</div><p><Link className="admin-secondary-link" href="/admin/system">Open system details →</Link></p></div></details>
    <details className="readiness-details"><summary>About the October test evidence</summary><div className="readiness-details-body"><p className="admin-note">On 9 October, live Stripe showed the €4 refund issued and the full €3.40 creator transfer reversed; ReplyPass showed payment refunded and transfer reversed for the same payment and transfer IDs. Stripe still says the card credit may take several business days. This is a dated evidence snapshot, not a live Stripe balance feed or proof of bank payout.</p><p className="admin-note">For each completed financial check, record the date, tester, ReplyPass payment ID, Stripe IDs, expected and actual amounts, and outcome in the owner checklist.</p></div></details>
  </>;
}
