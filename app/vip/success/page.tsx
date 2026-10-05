import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { serviceDatabase } from "@/lib/stripe/server";
import { stripeConfig } from "@/lib/stripe/config";
import { vipAccessEligible } from "@/lib/vip/model";

export const metadata = { title: "Your VIP membership", robots: { index: false, follow: false } };

type Membership = {
  id: string;
  status: string;
  current_period_end: string | null;
  amount_cents: number;
  currency: string;
  membership_name: string | null;
  creator_profiles: {
    handle: string;
    profiles: { display_name: string } | null;
  } | null;
};

export default async function Page() {
  const viewer = await requireRole(["fan", "creator", "admin"], "/vip/success");
  let membership: Membership | null = null;

  if (!viewer.demo) {
    const mode = stripeConfig()?.mode;
    if (!mode) throw Error("Membership billing unavailable.");
    const { data, error } = await serviceDatabase()
      .from("subscriptions")
      .select("id,status,current_period_end,amount_cents,currency,membership_name,creator_profiles(handle,profiles!creator_profiles_profile_id_fkey(display_name))")
      .eq("fan_id", viewer.id)
      .eq("stripe_mode", mode)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw Error("Membership status unavailable.");
    membership = ((data || []) as unknown as Membership[]).find((item) => vipAccessEligible(item.status, item.current_period_end)) || null;
  }

  const creatorName = membership?.creator_profiles?.profiles?.display_name || "your creator";
  const creatorHandle = membership?.creator_profiles?.handle;
  const creatorVipUrl = creatorHandle ? `/@${encodeURIComponent(creatorHandle)}/vip` : "/vip";
  const amount = membership ? new Intl.NumberFormat("en-IE", { style: "currency", currency: membership.currency.toUpperCase() }).format(membership.amount_cents / 100) : null;

  return (
    <main className="vip-success-page">
      <div className="vip-success-shell">
        <div className={`vip-success-card${membership ? " is-active" : ""}`}>
          <div className="vip-success-mark" aria-hidden="true">
            {membership ? <svg viewBox="0 0 24 24" fill="none"><path d="m6 12.5 4 4L18.5 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg> : <span>♡</span>}
          </div>
          <span className="eyebrow">{membership ? "YOU’RE IN" : "ONE MOMENT"}</span>
          <h1>{membership ? `Welcome to ${creatorName}’s VIP.` : "We’re confirming your membership."}</h1>
          <p className="vip-success-intro">
            {membership
              ? "A little closer starts here. Your private posts and member-only updates are ready when you are."
              : "Stripe is confirming your payment. Your membership will appear here as soon as it’s ready; access is only granted after confirmation."}
          </p>

          {membership && (
            <div className="vip-success-membership" aria-label="Membership details">
              <div>
                <span className="vip-success-label">YOUR MEMBERSHIP</span>
                <strong>{membership.membership_name || "VIP membership"}</strong>
                <span>Renews monthly until you cancel</span>
              </div>
              <strong className="vip-success-price">{amount}<small> / month</small></strong>
            </div>
          )}

          <div className="vip-success-actions">
            {membership ? (
              <>
                <Link className="button button-primary" href={creatorVipUrl}>Explore VIP posts <span aria-hidden="true">↗</span></Link>
                <Link className="button button-secondary" href="/account/subscriptions">Manage membership</Link>
              </>
            ) : (
              <Link className="button button-primary" href="/account/subscriptions">Check membership status</Link>
            )}
          </div>
          <p className="vip-success-footnote">You can manage or cancel your membership anytime from your account.</p>
        </div>
      </div>
    </main>
  );
}
