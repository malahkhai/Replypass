# ReplyPass public-launch readiness — 13 October 2026

**Decision: paid public launch is not yet verified.** This is a gate-based report, not a percentage. PR #14 merged into `main` on 12 October and Vercel reported a successful production deployment. The creator dashboard now prompts Stripe setup on mobile and distinguishes money at Stripe from bank payout stages. This improves clarity; it does not prove that any creator has received a bank payout.

| Gate | Status | Evidence and next action |
| --- | --- | --- |
| Live Guaranteed Reply charge | Partially verified | Owner screenshots show a €4 charge and a €3.40 transfer to a connected Stripe account. Match the charge, transfer, ReplyPass payment and fee records by ID before closing this gate. |
| Creator-country eligibility | Open | Confirm each creator's real country and connected-account eligibility with Stripe. The earlier Nigeria/France mismatch remains unresolved in the recorded evidence. Do not use an inaccurate country to complete onboarding. |
| Creator bank payout | Open | A transfer to a connected Stripe balance is not a payout to a bank. Record a settled bank payout for an eligible, verified creator. The new dashboard displays Stripe's payout stages but does not create or accelerate payouts. |
| October test-money disposition | Open | Reconcile the live €4 charge, €3.40 transfer, platform fee, Stripe fees, refund state and any transfer reversal or recovery liability by provider and local IDs. |
| Live failure and refund paths | Open | Test one decline, one expired request and one real refund with the corresponding transfer reversal or recovery liability. Sandbox results do not close live-money gates. |
| VIP live lifecycle | Open | Sandbox checkout and cancellation sync were verified. A live subscription, renewal failure, bank settlement and access removal remain unverified. |
| Mobile checkout and wallets | Open | Complete iPhone Safari, Instagram in-app browser, Android Chrome and eligible wallet journeys with a verified creator. |
| Operations and legal | Open | The owner showed a recovered payment cron and successful webhook responses. Verify continuing runs, alert delivery, operator details and professional legal review before broad commercial launch. |

## Product experience

- **Shipped:** Mobile creator navigation includes Money. The dashboard points new creators to Stripe onboarding; the payout page separates pending, available, scheduled, in-transit and paid funds. “Paid” means Stripe sent the payout; bank posting can follow later. Local typecheck, lint, build and 89 tests passed, and Vercel marked the production deployment successful. A signed-in production view with a real connected creator has not yet been manually checked.
- **Next improvement:** The creator currently uploads one image. Its public hero uses a fixed crop, so a face can be cut off. A three-image gallery with a per-image mobile crop/position preview is a product-quality improvement, not a substitute for any financial gate.
- **Agreed next improvement:** Show a fan's display name, optional self-reported country and optional short introduction to the relevant creator on a request. A notification can summarize those details without treating them as verified identity. Do not add age or gender to signup for this feature. Creator country is already collected for their profile and Stripe onboarding.

## Next controlled test

1. Confirm the connected creator's correct country, required identity information, `transfers` and `payouts` status with Stripe.
2. Match the existing live payment and connected-account transfer to ReplyPass records. Check its present refund and reversal state before initiating another transaction.
3. With an eligible creator, record a small live Guaranteed Reply from a separate fan, including the ReplyPass payment ID, Stripe PaymentIntent, charge, transfer, exact fees and bank payout result. Inspect both fan and creator views.
4. Separately verify a live refund/reversal, decline and expiry. Stop to investigate if Stripe and ReplyPass disagree rather than repeating a financial action.

The [9 October report](PUBLIC_LAUNCH_READINESS_2026-10-09.md) is the previous evidence snapshot. This update uses the PR #14 deployment result and the earlier owner-provided payment evidence; it is not a fresh audit of Stripe balances or bank statements.
