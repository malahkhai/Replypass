import Link from "next/link";
import { AdminHeading, AdminTable, Status } from "@/components/admin-ui";
import { adminPayouts } from "@/lib/admin/repository";

export default async function Page() {
  const rows = await adminPayouts();
  return <>
    <AdminHeading eyebrow="CREATOR FUNDS" title="Payouts" description="Track bank payouts reported to ReplyPass. Stripe determines verification holds and payout timing." />
    <section className="admin-card"><h2>Transfer versus payout</h2><p>A payment transfer moves money into a creator’s connected Stripe balance. A payout moves money from that balance to their bank. Check <Link href="/admin/payments">Payments</Link> for transfers and the connected Stripe account for final bank settlement.</p></section>
    <AdminTable head={["Creator", "Amount", "Bank payout status", "Expected arrival", "Stripe payout ID"]}>
      {rows.map((p: any) => <tr key={p.id}><td><strong>{p.creator_id}</strong></td><td>{new Intl.NumberFormat("en-GB", { style: "currency", currency: p.currency.toUpperCase() }).format(p.amount_cents / 100)}</td><td><Status tone={p.status === "paid" ? "good" : p.status === "failed" ? "bad" : "warn"}>{p.status}</Status></td><td>{p.arrival_date || "—"}</td><td><small>{p.stripe_payout_id || "Not assigned"}</small></td></tr>)}
    </AdminTable>
  </>;
}
