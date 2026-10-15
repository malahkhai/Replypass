# ReplyPass public-launch readiness — 9 October 2026

**Decision: paid public launch remains blocked.** This is a hard-gate scorecard, not a guessed percentage. The October live test now verifies payment capture, refund and full connected-account transfer reversal. It did not establish a bank payout or creator-country eligibility.

| Gate | Status | Evidence and next action |
| --- | --- | --- |
| Live Guaranteed Reply charge | Verified for this test | Stripe and ReplyPass show the same €4 captured payment and €3.40 connected-account transfer. The platform gross share was €0.60 before Stripe fees. Repeat with an eligible creator before launch. |
| Creator-country eligibility | Blocked | One creator reported Stripe payout-onboarding failure while in Nigeria. The test creator also lives in Nigeria, while their connected account screenshot showed France. Confirm the correct country and account status with Stripe. Do not enter a different country to pass onboarding. Verify France-to-US Connect transfers before treating a US creator as the solution. |
| Creator bank payout | Open | A Stripe transfer to a connected balance is not a bank payout. No settled payout to the test creator's bank is evidenced. Test end-to-end with an eligible creator whose account is verified for transfers and payouts. |
| October test-money disposition | Refund/reversal verified; card receipt pending | On 9 October, Stripe showed a full €4 refund issued and a full €3.40 transfer reversal. ReplyPass Admin showed `refunded` / `reversed` for the matching payment and transfer IDs. Stripe says the card credit may take several business days; confirm its arrival separately. Original Stripe processing fees were not returned. |
| Live failure and refund paths | Partially verified | The live refund and transfer reversal succeeded. Live decline and cron-driven expiry remain unverified; both must release authorization without creator earnings. |
| VIP live lifecycle | Open | Sandbox checkout and period-end cancellation sync were verified. Live payment, renewal failure, bank settlement and access removal remain unverified. The owner previously asked to defer the live VIP charge. |
| Mobile checkout and wallets | Open | Run iPhone Safari and Instagram in-app browser and eligible Apple Pay/Google Pay checks with an eligible creator. |
| Operations and legal | Open | Cron recovered and live webhook deliveries returned HTTP 200 in owner screenshots. Continue monitoring new deliveries; confirm alert delivery, legal/operator details and professional review before launch. |

## Next controlled test

1. Ask Stripe to confirm supported connected-account countries and the France-to-US transfer path for the current Accounts v2 recipient / separate-charges-and-transfers setup. A US residence alone does not establish that a French platform can transfer to that account.
2. Onboard an eligible creator using their real country, verify `stripe_transfers` and payouts are active, and confirm the bank account is valid.
3. Make one small live Guaranteed Reply payment with a separate fan. Save the ReplyPass payment ID, Stripe PaymentIntent/charge/transfer IDs, exact fees, and evidence of the eventual bank payout. Check fan and creator views.
4. Run live decline and expiry tests. Confirm the October refund reaches the original card; do not issue a second refund. Stop if Stripe or local records disagree; investigate rather than repeat a financial operation blindly.

The [5 October report](PUBLIC_LAUNCH_READINESS_2026-10-05.md) remains the historical sandbox baseline. The 9 October refund and reversal findings were checked directly in live Stripe and ReplyPass Admin. This remains a dated snapshot, not continuous monitoring or confirmation that the card credit has settled.
