import { AdminAction } from "@/components/admin-actions";
import { AdminHeading, AdminTable, Status } from "@/components/admin-ui";
import { adminCreators } from "@/lib/admin/repository";

export default async function Page({ searchParams }: { searchParams: Promise<{ creator?: string }> }) {
  const selected = (await searchParams).creator;
  const all = await adminCreators();
  const creators = selected ? all.filter((c: any) => c.id === selected) : all;
  return <>
    <AdminHeading eyebrow="PEOPLE" title="Creators" description="Profiles publish after email verification. Paid products depend on Stripe eligibility and creator opt-in." />
    <p className="admin-note">Link copies count copy-button actions over the past seven days; they do not measure visits or purchases.</p>
    <AdminTable head={["Creator", "Link copies · 7 days", "Payout setup", "Products / activity", "Actions"]}>
      {creators.map((c: any) => {
        const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        const stripe = Array.isArray(c.creator_stripe_accounts) ? c.creator_stripe_accounts[0] : c.creator_stripe_accounts;
        const products = (c.creator_pricing || []).filter((p: any) => p.active).map((p: any) => p.kind.replace("_", " ")).join(", ") || "None";
        const replies = (c.paid_interactions || []).filter((i: any) => ["captured", "completed"].includes(i.status)).length;
        const vip = (c.subscriptions || []).filter((s: any) => ["active", "trialing"].includes(s.status)).length;
        return <tr key={c.id}>
          <td><strong>{profile?.display_name || `@${c.handle}`}</strong><small>@{c.handle} · {c.verified ? "verified" : "not verified"}</small><small><Status tone={c.status === "approved" ? "good" : c.status === "suspended" ? "bad" : "warn"}>{c.status}</Status></small></td>
          <td><strong>{c.linkCopies7d + c.profileLinkCopies7d}</strong><small>Dashboard {c.linkCopies7d} · Public profile {c.profileLinkCopies7d}</small></td>
          <td><Status tone={stripe?.ready ? "good" : "warn"}>{stripe?.ready ? "Eligible" : "Not eligible"}</Status><small>Stripe transfers and payouts must both be checked.</small></td>
          <td><strong>{products}</strong><small>{replies} completed replies · {vip} active VIP</small></td>
          <td><details className="admin-row-menu"><summary>Manage creator</summary><div className="admin-controls">{["under_review", "rejected", "suspended"].includes(c.status) && <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="approve" label="Approve" confirm={`Approve @${c.handle} after review?`} />}{c.status !== "rejected" && <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="reject" label="Reject" reason variant="danger" />}{c.status === "suspended" ? <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="unsuspend" label="Unsuspend" /> : <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="suspend" label="Suspend" reason variant="danger" confirm={`Suspend @${c.handle}?`} />}{c.verified ? <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="remove_verification" label="Remove check" /> : <AdminAction endpoint={`/api/admin/creators/${c.id}`} action="restore_verification" label="Verify" />}</div></details></td>
        </tr>;
      })}
    </AdminTable>
  </>;
}
