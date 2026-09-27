# ReplyPass V1 security boundaries

V1 sells **Guaranteed Reply** and **VIP** only. Public profiles and onboarding show current offers; the paid-request API also rejects postponed products. Existing historical media remains accessible only to the entitled parties.

The browser never supplies the authoritative amount, fee, currency or creator destination. The server reads approved creator state, active pricing and eligible Stripe Connect capabilities. PaymentIntent IDs, Stripe webhooks and live/test mode are verified before financial state changes. Webhook signatures are checked on the raw body and replayed event IDs are idempotent.

Fan/creator/admin roles come from trusted profiles. Admin routes require a server-side admin role. Creator ownership and fan conversation access are checked before reads or mutations. Private VIP posts and signed media URLs require an active/trialing membership with a future paid-through date; null/expired periods never grant access. The matching database function is in migration `202609270002_vip_access_requires_period.sql`.

Financial tables use service-only writes and immutable amount snapshots. Refund, capture, transfer and reversal operations use durable IDs or idempotency keys. Shared rate limiting, same-origin checks and strict input lengths protect critical mutations. Production demo checkout is disabled and production public lookups do not fall back to fictional creators.

Monitoring sends sanitized error metadata only; no card data, secrets, message text or private media URLs. A received Sentry test event proves ingestion, while actionable alerts and real incident handling still need dashboard verification. A passing test suite does not prove live-money settlement.
