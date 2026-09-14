# VIP memberships

ReplyPass VIP uses Stripe Checkout subscriptions created on the platform as Connect destination charges. Stripe receives the server-selected monthly Price, sends 85% to the creator account, and retains a 15% application fee for ReplyPass. All credentials remain server-only and Task 5 accepts test keys only.

Stripe webhooks, rather than the success URL, control membership state. `checkout.session.completed` binds Stripe identifiers; subscription created/updated/deleted events synchronize status and billing periods; `invoice.paid` records immutable integer-minor-unit earnings; `invoice.payment_failed` moves the membership to `past_due`. Only `active` and `trialing` memberships inside their current period receive access.

Changing a creator price creates a new immutable Stripe Price at the next checkout. Existing subscriptions keep their agreed Stripe Price. Disabling VIP blocks new checkout sessions and leaves existing subscriptions unchanged. Fans manage payment methods and period-end cancellation through Stripe's hosted customer portal.

VIP photos live in the private `vip-media` bucket. APIs return only five-minute signed URLs after checking the authenticated fan's current membership. Non-members receive plan copy and a locked preview; private post bodies and storage paths are never returned.

## Stripe test configuration

Add these events to the existing `/api/stripe/webhook` endpoint:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Enable the test-mode customer portal and allow cancellation at period end plus payment-method updates. Apply `202609140002_vip_memberships.sql` in Supabase before deploying the application commit.
