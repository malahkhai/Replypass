# ReplyPass public-launch readiness — 9 October 2026

**Decision: paid public launch remains blocked.** This is a hard-gate scorecard, not a guessed percentage. The October live test advanced payment capture and connected-account transfer evidence, but did not establish a bank payout or creator-country eligibility.

| Gate | Status | Evidence and next action |
| --- | --- | --- |
| Live Guaranteed Reply charge | Partially verified | Owner screenshots show a €4 charge and a €3.40 transfer to the test creator's connected Stripe account. Match the charge, transfer, ReplyPass payment and fee records by ID before closing this gate. The expected platform gross share is €0.60 before Stripe fees. |
| Creator-country eligibility | Blocked | One creator reported Stripe payout-onboarding failure while in Nigeria. The test creator also lives in Nigeria, while their connected account screenshot showed France. Confirm the correct country and account status with Stripe. Do not enter a different country to pass onboarding. Verify France-to-US Connect transfers before treating a US creator as the solution. |
| Creator bank payout | Open | A Stripe transfer to a connected balance is not a bank payout. No settled payout to the test creator's bank is evidenced. Test end-to-end with an eligible creator whose account is verified for transfers and payouts. |
| October test-money disposition | Open | Check the live €4 charge, €3.40 transfer, available balance, refund and transfer-reversal state. If the owner chooses to unwind the test, issue the fan refund once through Admin → Payments and verify the separate transfer reversal or recovery liability. |
| Live failure and refund paths | Open | Test decline, cron-driven expiry, and a real refund with transfer reversal. Sandbox results in the 5 October report do not close live-money gates. |
| VIP live lifecycle | Open | Sandbox checkout and period-end cancellation sync were verified. Live payment, renewal failure, bank settlement and access removal remain unverified. The owner previously asked to defer the live VIP charge. |
| Mobile checkout and wallets | Open | Run iPhone Safari and Instagram in-app browser and eligible Apple Pay/Google Pay checks with an eligible creator. |
| Operations and legal | Open | Cron recovered and live webhook deliveries returned HTTP 200 in owner screenshots. Continue monitoring new deliveries; confirm alert delivery, legal/operator details and professional review before launch. |

## Next controlled test

1. Ask Stripe to confirm supported connected-account countries and the France-to-US transfer path for the current Accounts v2 recipient / separate-charges-and-transfers setup. A US residence alone does not establish that a French platform can transfer to that account.
2. Onboard an eligible creator using their real country, verify `stripe_transfers` and payouts are active, and confirm the bank account is valid.
3. Make one small live Guaranteed Reply payment with a separate fan. Save the ReplyPass payment ID, Stripe PaymentIntent/charge/transfer IDs, exact fees, and evidence of the eventual bank payout. Check fan and creator views.
4. Separately run a small live refund/reversal test, then decline and expiry tests. Stop if Stripe or local records disagree; investigate rather than repeat a financial operation blindly.

The [5 October report](PUBLIC_LAUNCH_READINESS_2026-10-05.md) remains the historical sandbox baseline. This update relies on owner-provided screenshots and statements; it is not a fresh audit of the live Stripe account.
