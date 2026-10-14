import { Icon } from "@/components/icon";
import { PayoutSetup } from "@/components/payout-setup";
import { Price } from "@/components/ui";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { stripeConfig } from "@/lib/stripe/config";
import { creatorPayoutOverview, type CreatorPayoutOverview } from "@/lib/stripe/creator-payout-overview";

export const metadata = { title: "Payouts" };

export default async function Page() {
  const viewer = await requireRole(["creator", "admin"]);
  const stripe = stripeConfig();
  const enabled = !!stripe;
  let status: CreatorPayoutOverview = {
    connected: false,
    ready: false,
    transfers: false,
    payouts: false,
    requirementsDue: true,
    balanceAvailable: false,
    pendingCents: 0,
    availableCents: 0,
    scheduledCents: 0,
    inTransitCents: 0,
    paidCents: 0,
    paidIsRecent: false,
    nextArrival: null,
  };
  let statusError = false;

  if (enabled && !viewer.demo) {
    try {
      status = await creatorPayoutOverview(viewer.id);
    } catch {
      statusError = true;
    }
  }

  const needsAction = !status.ready || status.requirementsDue;
  const heading = !needsAction
    ? "You’re ready to get paid"
    : status.connected
      ? "Finish setting up payouts"
      : "Turn replies into earnings";

  return (
    <section className="payout-page">
      <header className="workspace-heading payout-heading">
        <div>
          <p className="eyebrow">PAYOUTS</p>
          <h1>{heading}</h1>
          <p>
            {needsAction
              ? "Complete your secure Stripe setup to receive ReplyPass earnings."
              : status.nextArrival
                ? `Stripe estimates your next bank arrival on ${new Date(status.nextArrival * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`
                : "Your payout account is ready. Track each payout stage below."}
          </p>
        </div>
        <span className="payout-mode-badge">
          <i /> Stripe {stripe?.mode || "demo"} mode
        </span>
      </header>

      {status.connected && (
        <section className="payout-money-section" aria-label="Money at Stripe and bank payouts">
          <div className="payout-money-title">
            <div>
              <p className="eyebrow">YOUR MONEY</p>
              <h2>Where your earnings are.</h2>
            </div>
            <Link href="/creator/earnings">See all earnings <Icon name="arrow" size={15} /></Link>
          </div>
          {status.balanceAvailable ? (
            <>
              <div className="payout-money-grid">
                <article><span>Pending at Stripe</span><strong><Price cents={status.pendingCents} decimals /></strong><small>Processing before payout</small></article>
                <article><span>Available at Stripe</span><strong><Price cents={status.availableCents} decimals /></strong><small>Waiting for the next payout</small></article>
                <article><span>Scheduled payout</span><strong><Price cents={status.scheduledCents} decimals /></strong><small>Stripe is preparing to send it</small></article>
                <article><span>On the way to bank</span><strong><Price cents={status.inTransitCents} decimals /></strong><small>{status.nextArrival ? `Stripe estimates ${new Date(status.nextArrival * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No payout in transit"}</small></article>
                <article><span>{status.paidIsRecent ? "Recently sent by Stripe" : "Sent by Stripe"}</span><strong><Price cents={status.paidCents} decimals /></strong><small>Bank arrival may take longer</small></article>
              </div>
              <p className="payout-money-explainer">These are Stripe payout stages, not extra charges. A completed reply first appears in Earnings, then moves through Stripe’s balance before a bank payout. “Paid” means Stripe sent it; your bank may take longer to show it.</p>
            </>
          ) : (
            <p className="payout-money-explainer" role="status">Stripe’s balance is temporarily unavailable. Your setup status is shown below; refresh to check the money amounts again.</p>
          )}
        </section>
      )}

      <div className="payout-layout">
        <article className="payout-hero-card">
          <div className="payout-card-topline">
            <span className="payout-icon">
              <Icon name={!needsAction ? "check" : "shield"} size={24} />
            </span>
            <span
              className={`payout-state ${!needsAction ? "ready" : "pending"}`}
            >
              {!needsAction
                ? "Ready"
                : status.connected
                  ? "Action needed"
                  : "Not connected"}
            </span>
          </div>

          <div className="payout-card-copy">
            <p className="eyebrow">POWERED BY STRIPE</p>
            <h2>
              {!needsAction
                ? "Your payout account is active."
                : "Set up your payout account."}
            </h2>
            <p>
              {!needsAction
                ? "You can accept secured replies and receive your creator share."
                : "Stripe verifies your identity and sends earnings directly to your bank account."}
            </p>
          </div>

          {statusError ? (
            <div className="payout-alert" role="alert">
              <Icon name="close" size={18} />
              <span>
                We couldn’t refresh your payout status. You can safely try
                again.
              </span>
            </div>
          ) : (
            <div className="payout-status-grid" aria-label="Payout status">
              <div>
                <span>Transfers</span>
                <strong>
                  <i className={status.transfers ? "active" : ""} />
                  {status.transfers ? "Enabled" : "Pending"}
                </strong>
              </div>
              <div>
                <span>Bank payouts</span>
                <strong>
                  <i className={status.payouts ? "active" : ""} />
                  {status.payouts ? "Enabled" : "Pending"}
                </strong>
              </div>
            </div>
          )}

          {statusError ? (
            <Link className="button button-secondary" href="/creator/payouts">Refresh payout status</Link>
          ) : enabled && !viewer.demo ? (
            !needsAction ? (
              <div className="payout-ready-note">
                <Icon name="check" size={18} />
                <span>
                  <strong>Payout setup complete</strong>
                  Guaranteed Reply is enabled on your creator profile. Stripe sends eligible earnings to the bank you added during setup.
                </span>
              </div>
            ) : (
              <PayoutSetup connected={status.connected} />
            )
          ) : (
            <p className="demo-notice payout-demo-notice">
              Demo mode is active. Add Stripe credentials and Supabase to
              try payout onboarding.
            </p>
          )}
        </article>

        <aside className="payout-guide-card">
          <p className="eyebrow">WHAT TO EXPECT</p>
          <h2>{needsAction ? "A quick, secure setup." : "Your payout journey."}</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>{needsAction ? "Confirm your details" : "Account verified"}</strong>
                <p>{needsAction ? "Stripe will ask about you and your creator activity." : "Stripe has the details needed for payouts."}</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>{needsAction ? "Add your payout account" : "Earnings reach Stripe"}</strong>
                <p>{needsAction ? "Your bank information is handled directly by Stripe." : "Completed replies move to your Stripe balance."}</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>{needsAction ? "Start accepting replies" : "Stripe sends your bank payout"}</strong>
                <p>{needsAction ? "Guaranteed Reply unlocks when Stripe approves your account." : "The bank may show the payment after Stripe marks it paid."}</p>
              </div>
            </li>
          </ol>
        </aside>
      </div>

      <div className="payout-trust-row">
        <div>
          <Icon name="shield" size={20} />
          <span>
            <strong>Your details stay protected</strong>
            ReplyPass never stores your bank login or card details.
          </span>
        </div>
        <div>
          <span className="payout-fee">85%</span>
          <span>
            <strong>Your creator share</strong>
            ReplyPass keeps a 15% platform fee from completed requests.
          </span>
        </div>
      </div>
    </section>
  );
}
