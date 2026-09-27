# ReplyPass V1 operations

Launch products are **Guaranteed Reply** and **VIP**. Admin → Launch readiness shows configuration status and the manual verification list. Never treat a configured key or a synthetic event as proof of a real payment.

## Guaranteed Reply

- **Authorized but no reply:** the five-minute protected `/api/cron/payments` job must cancel expired holds. Check `operational_runs`, the payment's deadline/state, Stripe PaymentIntent and Admin → Reconciliation. Do not capture an unfulfilled request.
- **Declined:** confirm the PaymentIntent is canceled and no charge, fee or creator earnings were recorded. A bank may take time to remove the pending hold.
- **Captured, transfer failed:** retain the creator amount as owed, inspect Stripe destination/capabilities and use Admin's idempotent transfer retry only after resolving the cause. Do not mark the creator paid based on an earnings display.
- **Refund:** use Admin → Payments for a captured reply and record a reason. Compare Stripe refund and transfer reversal with the local refund/audit records. A failed reversal remains a recovery liability; do not issue a second fan refund.
- **Webhook/cron failure:** inspect Stripe deliveries, the webhook inbox, `operational_runs` and Sentry. Retry verified idempotent operations; never edit financial state directly in Supabase.

## VIP

- Stripe Checkout creates the monthly subscription with a 15% application fee and creator transfer destination. The current creator price applies only to new subscribers; an existing Stripe Price remains on an existing subscription.
- Stripe webhook state and a future `current_period_end` are required for private access. The billing portal should cancel **at period end**. Confirm that setting in live Stripe before relying on it.
- For a failed renewal, compare the Stripe subscription/invoice with Admin → Subscriptions and the local `subscription_payments` ledger. The fan must not keep access after the paid-through date or when status is no longer active/trialing.
- A VIP refund is not handled by the Guaranteed Reply refund button; investigate in Stripe and reconcile the subscription ledger and creator destination separately. Do not promise automated VIP refund/reversal before that path is built and tested.

## Safe financial mode handling

Production totals default to **live** Reply payments. Historic test rows are retained under test mode; ambiguous rows stay unknown. A production operation must fail on a mode mismatch. Do not reclassify a row from a date, creator name or Stripe ID prefix.

Do not copy card details, private messages, access tokens or signed media URLs into logs, Sentry, support notes or the owner checklist.
