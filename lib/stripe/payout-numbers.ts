export type MoneyAmount = { amount: number; currency: string };
export type PayoutAmount = MoneyAmount & {
  status: string;
  arrival_date: number;
};

export function payoutNumbers(
  balance: { pending: MoneyAmount[]; available: MoneyAmount[] },
  payouts: PayoutAmount[],
  currency = "eur",
) {
  const amount = (items: MoneyAmount[]) =>
    items.filter((item) => item.currency === currency).reduce((sum, item) => sum + item.amount, 0);
  const scheduled = payouts.filter((payout) => payout.currency === currency && payout.status === "pending");
  const moving = payouts.filter((payout) => payout.currency === currency && payout.status === "in_transit");

  return {
    pendingCents: amount(balance.pending),
    availableCents: amount(balance.available),
    scheduledCents: amount(scheduled),
    inTransitCents: amount(moving),
    paidCents: amount(payouts.filter((payout) => payout.status === "paid")),
    nextArrival: moving.length ? Math.min(...moving.map((payout) => payout.arrival_date)) : null,
  };
}
