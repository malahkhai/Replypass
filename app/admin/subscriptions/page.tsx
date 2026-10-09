import { AdminHeading, AdminTable, Status } from "@/components/admin-ui";
import { adminSubscriptions } from "@/lib/admin/repository";

export default async function Page() {
  const rows = await adminSubscriptions();
  return <>
    <AdminHeading eyebrow="RECURRING PAYMENTS" title="Subscriptions" description="Inspect VIP memberships and their billing state. Customer billing changes stay in the Stripe portal." />
    <AdminTable head={["Membership", "Mode", "People", "Price", "Billing status", "Period end", "Stripe ID"]}>
      {rows.map((s: any) => <tr key={s.id}>
        <td><strong>{s.membership_name || "VIP"}</strong><small>{s.id}</small></td>
        <td><Status tone={s.stripe_mode === "live" ? "good" : "warn"}>{s.stripe_mode}</Status></td>
        <td><small>Fan {s.fan_id}<br />Creator {s.creator_id}</small></td>
        <td>{new Intl.NumberFormat("en-GB", { style: "currency", currency: s.currency.toUpperCase() }).format(s.amount_cents / 100)}/month</td>
        <td><Status tone={["active", "trialing"].includes(s.status) ? "good" : s.status === "past_due" ? "warn" : "neutral"}>{s.status}</Status>{s.cancel_at_period_end && <small>Cancels at period end</small>}</td>
        <td>{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("en-GB") : "—"}</td>
        <td><small>{s.stripe_subscription_id || "Pending checkout"}</small></td>
      </tr>)}
    </AdminTable>
  </>;
}
