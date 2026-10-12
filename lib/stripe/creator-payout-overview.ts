import "server-only";
import { connectAccountTable } from "./account-table";
import { connectStatus } from "./connect";
import { payoutNumbers } from "./payout-numbers";
import { paymentBackend } from "./server";

export type CreatorPayoutOverview = {
  connected: boolean;
  ready: boolean;
  transfers: boolean;
  payouts: boolean;
  requirementsDue: boolean;
  balanceAvailable: boolean;
  pendingCents: number;
  availableCents: number;
  scheduledCents: number;
  inTransitCents: number;
  paidCents: number;
  paidIsRecent: boolean;
  nextArrival: number | null;
};

const emptyOverview: CreatorPayoutOverview = {
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

/** Read a creator's own Connect account. All amounts displayed here are EUR cents. */
export async function creatorPayoutOverview(userId: string, { persistStatus = true }: { persistStatus?: boolean } = {}): Promise<CreatorPayoutOverview> {
  const { db, stripe, config } = paymentBackend();
  const { data: creator, error: creatorError } = await db
    .from("creator_profiles")
    .select("id")
    .eq("profile_id", userId)
    .single();
  if (creatorError || !creator) throw Error("Creator payout status unavailable.");

  const status = await connectStatus(creator.id, { persist: persistStatus });
  const overview = { ...emptyOverview, ...status };
  if (!status.connected) return overview;

  const { data: account, error: accountError } = await db
    .from(connectAccountTable(config.mode))
    .select("stripe_account_id")
    .eq("creator_id", creator.id)
    .single();
  if (accountError || !account?.stripe_account_id)
    throw Error("Creator payout account unavailable.");

  try {
    const options = { stripeAccount: account.stripe_account_id };
    const [balance, payouts] = await Promise.all([
      stripe.balance.retrieve({}, options),
      stripe.payouts.list({ limit: 100 }, options),
    ]);
    return {
      ...overview,
      balanceAvailable: true,
      ...payoutNumbers(balance, payouts.data),
      paidIsRecent: payouts.has_more,
    };
  } catch {
    // A temporary Stripe balance error must not hide the setup action.
    return overview;
  }
}
