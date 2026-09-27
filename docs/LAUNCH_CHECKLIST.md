# ReplyPass V1 launch checklist

**Scope:** Guaranteed Reply and VIP Membership only. Voice notes, paid photos, video requests, live chat, tips, credits and wallets are postponed. Historical data and code remain for audit; new paid media checkouts are rejected server-side.

## Code/configuration checks

- Creator offer and VIP checkout read authoritative server-side prices; reply checkout snapshots the gross, 15% fee and 85% creator share.
- Creator acceptance does not capture. A qualifying reply triggers capture and transfer; decline and expiry cancel the authorization. Refunds are idempotent and reverse the creator transfer when applicable.
- VIP uses Stripe-hosted monthly Checkout with a 15% application fee and creator destination. Webhooks control access; period-end cancellation retains access only through the paid-through date. This is code readiness, not proof of a real charge or payout.
- Production demo checkout is disabled; live/test Reply payments are separated by immutable `stripe_mode`. Unknown historical mode is not counted as live. Historical test records remain inspectable.
- Admin → Launch readiness distinguishes configured services from real-world verification. `/api/health` is a configuration check, not a payment-flow test.
- Email, cron, monitoring and analytics configuration require both code checks and provider/dashboard verification. Analytics and advertising remain consent-gated.

## Unverified real-world steps

Use [Final owner launch steps](FINAL_OWNER_LAUNCH_STEPS.md) for the short ordered checklist and evidence fields. In particular, no real VIP subscription has been purchased at the owner's request. A passing test suite does not prove a live bank payout, refund, renewal or mobile wallet.

Legal and operator facts requiring professional review are in [Legal required info](LEGAL_REQUIRED_INFO.md). Keep the launch controlled until those facts and the live financial cases are resolved.
