# ReplyPass operations runbook

## Failed payment

Open Admin → Payments and locate the reply payment by its local ID or Stripe PaymentIntent. Compare the local state with Stripe. Do not manually mark a payment captured. Re-run the protected payments cron after checking the webhook inbox; unresolved differences belong in Reconciliation.

## Failed transfer

The payment remains a creator liability. Open the payment, confirm the destination account and amount, and use Retry transfer only when the Stripe account is eligible. The action is idempotent and searches Stripe for an existing transfer before creating another one.

## Request stuck in authorized

Check the request deadline and creator status. A qualifying reply or validated media delivery is required for capture. If the request expired or was declined, the cron cancels the authorization. Never capture an unfulfilled request.

## Subscription mismatch

Compare Admin → Subscriptions with the Stripe subscription ID and webhook inbox. Stripe is authoritative for billing status. Re-deliver the missing webhook or use the safe reconciliation action; do not edit financial state directly in Supabase.

## Refund

Refund only captured payments from Admin → Payments. Supply a reason. The refund record and audit entry are written before the idempotent Stripe refund call. Transfers may require a reversal and are flagged for review if the creator balance cannot be recovered.

## Dispute

Admin → Disputes shows the Stripe dispute, amount, reason, status, and evidence deadline. Work the evidence in Stripe Dashboard. ReplyPass records the state and marks the payment for reconciliation; it does not auto-submit evidence.

## Failed webhook

Check Stripe webhook delivery and `stripe_webhook_events.attempts`. Signature failures are rejected. A failed event remains unprocessed so Stripe can retry; inspect the structured logs without copying secrets, private text, or media URLs.

## Failed cron

Confirm the external scheduler sent `Authorization: Bearer $CRON_SECRET`, then inspect `/api/health` and the latest `operational_runs` row. Retry after resolving configuration or provider availability. Vercel Hobby does not provide the required five-minute financial schedule.

## User suspension

Suspend from Admin → Users with a reason. Suspension prevents purchases, paid request acceptance, and publication of paid content. Preserve transactions and audit history. Unsuspend only after the report or support case is resolved.
