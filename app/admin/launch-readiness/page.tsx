import Link from "next/link";
import { AdminHeading, Status } from "@/components/admin-ui";
import { productionReadiness } from "@/lib/config/production";
import { serviceDatabase } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Launch readiness", robots: { index: false, follow: false } };
function completedRecently(value: string | null | undefined) {
  return !!value && Date.now() - Date.parse(value) < 15 * 60_000;
}

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
    { name: "Supabase, live Stripe keys, webhooks and rate limiting", ready: config.launchReady, detail: config.launchReady ? "Configuration present; financial outcomes still need live verification." : [...config.missing, ...config.blockers].join(", ") || "Configuration needs review." },
    { name: "Payment expiry scheduler", ready: recentCron, detail: recentCron ? `Last successful run: ${new Date(lastRun.completed_at!).toLocaleString("en-GB")}` : "No successful run in the last 15 minutes. Inspect the scheduler and operational logs." },
    { name: "Email", ready: !!process.env.EMAIL_API_KEY && !!process.env.EMAIL_FROM, detail: "Configuration only. Check provider delivery and a received test message separately." },
    { name: "Sentry", ready: !!process.env.ERROR_MONITORING_DSN, detail: "Configuration only. Confirm ingestion and an actionable alert in Sentry." },
    { name: "GA4 and Meta", ready: process.env.NEXT_PUBLIC_GA_ENABLED === "true" && process.env.NEXT_PUBLIC_META_ENABLED === "true", detail: "Consent-gated configuration only. Confirm events in the provider dashboards." },
  ];
  const manual = [
    "Confirm supported creator countries and France-to-US Connect transfers before another live charge",
    "Onboard an eligible creator with accurate country and identity details; verify transfers and payouts are active",
    "Reconcile the October €4 live test: charge, €3.40 connected-account transfer, bank payout status and any refund/reversal",
    "Real Guaranteed Reply with an eligible creator: authorization, reply, capture, 15/85 split, transfer and settled bank payout",
    "Real decline and expiry releases",
    "Real refund and transfer reversal, including recovery if the reversal fails",
    "Real VIP subscription, renewal failure and period-end cancellation",
    "iPhone Safari and Instagram in-app checkout",
    "Apple Pay and Google Pay on eligible devices",
    "Legal/operator details and professional review",
  ];
  return <><AdminHeading eyebrow="CONTROLLED LAUNCH" title="Launch readiness" description="Configuration checks are separate from real-world verification. No financial test is marked complete automatically."/>
    <section className="admin-card"><h2>Live configuration</h2><div className="attention-list">{checks.map(check=><p key={check.name}><Status tone={check.ready?"good":"warn"}>{check.ready?"Ready":"Needs attention"}</Status> <strong>{check.name}</strong><br/><small>{check.detail}</small></p>)}</div></section>
    <section className="admin-card"><h2>Real-money test snapshot · 9 October 2026</h2><p>Owner-provided Stripe screenshots show a €4 charge and a €3.40 transfer to the test creator’s connected Stripe account. They do not show a bank payout. The creator lives in Nigeria while the connected account shown in Stripe was created as French; a second creator reported payout-onboarding failure while in Nigeria. Review their actual eligibility and connected-account status before counting this as a completed payout.</p><p><Status tone="warn">Open</Status> Paid public launch remains blocked by creator eligibility, bank payout, refund/reversal and the other manual checks below. This dated snapshot is not a live Stripe balance or payout-status feed.</p></section>
    <section className="admin-card"><h2>Manual verification required</h2><p>Record the date, tester, Stripe object or support reference, and outcome in the owner checklist before marking any item done.</p><ul>{manual.map(item=><li key={item}>{item}</li>)}</ul><p><Link href="/admin/system">System details →</Link></p></section>
  </>;
}
