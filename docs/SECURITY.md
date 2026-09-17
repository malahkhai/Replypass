# ReplyPass security model

## Secrets and authority

Supabase service-role and Stripe secret keys are server-only environment variables. They are never read by client components or prefixed with `NEXT_PUBLIC_`. The frontend can display a quote, but the server loads the current creator price, currency, platform fee, Stripe destination, and payment state before creating or capturing anything.

## Payments

Stripe webhooks are signature-verified and stored in `stripe_webhook_events` before processing. Replayed events stop at the processed inbox row. Payment, transfer, refund, reversal, dispute, and subscription records use provider IDs plus idempotency keys. A captured request is only transferred after validated delivery or a qualifying reply.

## Access control

Admin pages call `requireAdmin` on the server. The role comes from the protected `profiles` table and is never accepted from signup metadata. Suspension, approval, refund, transfer retry, and moderation actions are recorded in `admin_audit_log`. Every paid request, conversation, subscription, media URL, and VIP post is checked for the authenticated party or active membership.

## Media

Paid deliveries and VIP media are stored in private Supabase buckets. Upload MIME types and size limits are checked on the server. Signed URLs are short-lived and generated only after ownership, entitlement, and status checks.

## Abuse controls

Mutations use same-origin checks, deterministic input limits, block enforcement, suspension checks, duplicate request guards, and a shared Redis-compatible rate-limit adapter. The local in-memory fallback is for development only.

## Known limitations

Provider-specific error monitoring and email sending require production configuration. Stripe live mode, production payout schedule, legal review, and external scheduler configuration are intentionally deferred to Task 7. No raw card data or private message content is stored by ReplyPass.
