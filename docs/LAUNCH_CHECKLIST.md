# ReplyPass launch checklist

Task 6 hardening is committed in the repository. This checklist separates automated checks from the work that must be completed in the production accounts before Task 7.

## Automated / complete

- Admin routes require a server-side `admin` profile role; browser users cannot self-promote.
- User and creator suspension state is stored and enforced before paid activity.
- Creator approval is separate from Stripe Connect payout eligibility.
- Refund, dispute, transfer, and reconciliation records have durable IDs and audit entries.
- Stripe webhook signatures and replay inbox checks are enabled.
- Private media uses ownership checks and short-lived signed URLs.
- Notification creation supports deterministic event keys.
- Email delivery is provider-agnostic and fails visibly in production when unconfigured.
- Sensitive mutations use same-origin checks and server-side rate limiting hooks.
- Demo auth and demo checkout are disabled in production.
- `/api/health`, security headers, no-index private routes, and account deletion request flow exist.
- Lint, TypeScript, unit tests, and production build pass for the committed revision.

## Manual / required before launch

- Vercel: set production Supabase URL/anon key/service role, Stripe test or live keys, webhook secret, `CRON_SECRET`, shared rate-limit REST credentials, and email provider credentials.
- Domain: verify `getreplypass.com` and the `www` redirect, then test canonical URLs and creator shares.
- Supabase: apply every migration, verify RLS, configure production SMTP, and add the production auth redirect URLs.
- Stripe: obtain live approval, configure live Connect onboarding, live webhook events, customer portal, payout schedule, and dispute notifications. Do not switch to live until Task 7.
- Email/DNS: configure SPF and DKIM; publish a DMARC policy after monitoring delivery.
- Scheduler: configure an external scheduler for `/api/cron/payments` with `Authorization: Bearer $CRON_SECRET`; Vercel Hobby does not provide the required five-minute schedule.
- GA4/Meta: verify consent behavior, production data streams, conversion events, and Meta Conversions API token storage.
- Error monitoring: connect the provider adapter and confirm secrets are server-only.
- Legal: have Terms, Privacy, Community Guidelines, and Creator Terms reviewed by counsel and replace draft language.
- QA: complete mobile, accessibility, browser, payment, payout, refund, dispute, account deletion, and private-media smoke tests.

## Scope freeze

V1 contains Guaranteed Reply, Voice Note Request, Photo Request, and VIP Membership. Live Chat, Video Requests, Tips, Wallet, Coins, credits, referrals, discovery, AI, and native apps remain out of scope.
