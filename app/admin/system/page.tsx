import Link from "next/link";
import { productionReadiness } from "@/lib/config/production";
import { AdminTestEmail } from "@/components/admin-test-email";
import { AdminTestMonitoring } from "@/components/admin-test-monitoring";
import { AdminHeading, Status } from "@/components/admin-ui";

export default function Page() {
  const readiness = productionReadiness();
  const issues = [...readiness.missing, ...readiness.blockers];
  return <>
    <AdminHeading eyebrow="OPERATIONS" title="System" description="Check configuration and delivery services. For the launch decision, open the readiness scorecard." />
    <div className="admin-link-grid">
      <Link href="/admin/launch-readiness"><strong>Launch readiness</strong><span>Current blockers and the next controlled tests →</span></Link>
      <Link href="/admin/system/reconciliation"><strong>Payment reconciliation</strong><span>Review differences between ReplyPass and Stripe →</span></Link>
      <Link href="/api/health"><strong>Health endpoint</strong><span>Open the basic operational health response →</span></Link>
    </div>
    <div className="admin-section-heading"><div><h2>Configuration</h2><p>Presence of settings does not prove live delivery or settlement.</p></div></div>
    <section className="admin-card"><h2><Status tone={readiness.launchReady ? "good" : "warn"}>{readiness.launchReady ? "Configured" : "Needs setup"}</Status> Required services</h2><p>{readiness.launchReady ? "Required settings are present. Complete the real-world checks on Launch readiness before public paid launch." : "The following settings need attention before public paid launch."}</p>{issues.length > 0 && <ul>{issues.map(item => <li key={item}>{item}</li>)}</ul>}</section>
    <div className="admin-section-heading"><div><h2>Delivery tests</h2><p>Send one test, then confirm receipt in the provider dashboard or inbox.</p></div></div>
    <div className="admin-system-tests"><section className="admin-card"><h2>Email delivery</h2><p>A successful API response only means the provider accepted the request.</p><AdminTestEmail /></section><section className="admin-card"><h2>Error monitoring</h2><p>Confirm the test event and alert appear in Sentry.</p><AdminTestMonitoring /></section></div>
  </>;
}
