import Link from "next/link";
import { AdminAction } from "@/components/admin-actions";
import { AdminHeading, AdminTable, Status } from "@/components/admin-ui";
import { adminPayments } from "@/lib/admin/repository";

const money = (n: number, c: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency: c.toUpperCase() }).format(n / 100);

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const requested = (await searchParams).mode;
  const mode = requested === "test" || requested === "unknown" ? requested : undefined;
  const rows = await adminPayments(mode);
  return <>
    <AdminHeading eyebrow="MONEY" title="Payments" description="Inspect real charge and transfer states here. Refund only after matching the ReplyPass record to Stripe." />
    <nav className="admin-tabs" aria-label="Payment mode">
      <Link href="/admin/payments" aria-current={!mode ? "page" : undefined}>Current mode</Link>
      <Link href="/admin/payments?mode=test" aria-current={mode === "test" ? "page" : undefined}>Sandbox</Link>
      <Link href="/admin/payments?mode=unknown" aria-current={mode === "unknown" ? "page" : undefined}>Unclassified</Link>
    </nav>
    <p className="admin-note">The platform fee shown below is ReplyPass’s share before Stripe fees. A transfer to a creator’s Stripe balance is separate from their bank payout.</p>
    <AdminTable head={["Transaction", "People", "Amount split", "Payment / transfer", "Stripe IDs", "Action"]}>
      {rows.map((p: any) => <tr key={p.id}>
        <td><strong>{p.interaction_kind.replace("_", " ")}</strong><small>{p.id} · {p.stripe_mode}</small></td>
        <td><small>Fan {p.fan_id}<br />Creator {p.creator_id}</small></td>
        <td><strong>{money(p.gross_cents, p.currency)}</strong><small>Platform share {money(p.fee_cents, p.currency)}<br />Creator {money(p.creator_cents, p.currency)}</small></td>
        <td><Status tone={p.needs_reconciliation || p.manual_review ? "warn" : p.payment_state === "captured" ? "good" : "neutral"}>{p.payment_state}</Status><small>Transfer: {p.transfer_state}</small></td>
        <td><small>{p.stripe_payment_intent_id || "No intent"}<br />{p.stripe_transfer_id || "No transfer"}</small></td>
        <td><div className="admin-controls">{!mode && p.payment_state === "captured" ? <AdminAction endpoint={`/api/admin/payments/${p.id}/refund`} action="refund" label="Refund" variant="danger" reason confirm={`Refund ${money(p.gross_cents, p.currency)}? This affects creator earnings.`} /> : p.payment_state === "authorized" ? <span className="admin-note">Cancel via request action</span> : null}{!mode && p.transfer_state === "failed" && <AdminAction endpoint={`/api/admin/payments/${p.id}/retry-transfer`} action="retry" label="Retry transfer" confirm="Retry this creator transfer?" />}</div></td>
      </tr>)}
    </AdminTable>
  </>;
}
