# ReplyPass V1 roadmap

ReplyPass gives fans a closer connection to the people they follow: message them, hear from them, request something personal, or become a VIP.

## V1 scope

| Product | Launch scope |
|---|---|
| Guaranteed Reply | Yes |
| Personal Voice Note | Yes — Task 4 |
| Photo Request | Yes — Task 4 |
| VIP Membership | Yes — Task 5 |
| Video Request | Later |
| Live Chat | Later |
| Tips | Later |
| ReplyPass Credit | Later |

After VIP, feature development freezes until launch hardening and production validation are complete.

## Task 4 — paid voice notes and photo requests

Both formats reuse the secured Guaranteed Reply order model: the server reads current creator pricing, creates an immutable minor-unit price snapshot, authorizes the fan's payment method, and publishes the request only after authorization succeeds.

Voice Note: request → authorization → creator accepts → creator records/uploads audio → private fan entitlement is created → payment captured → creator receives an 85% Connect transfer.

Photo Request: request → authorization → creator accepts → creator uploads a photo → private fan entitlement is created → payment captured → creator receives an 85% Connect transfer.

Delivery means the validated media object and fan entitlement were committed successfully. Capture does not wait for the fan to open the media. If the creator declines or misses the delivery deadline, ReplyPass cancels the authorization: **No delivery = no charge.**

Required safeguards:

- Private Supabase Storage buckets and owner-scoped RLS.
- Short-lived signed download URLs generated after authorization checks.
- Strict MIME signature, size and duration/dimension validation; filenames and client MIME values are not trusted.
- Request deadlines capped by the payment method's actual authorization window.
- Idempotent delivery, capture, Connect transfer and authorization-release operations.
- Fan media library and creator request management.
- Optional watermarked derivatives where useful; originals remain private and unchanged.
- Reporting and blocking integrated with request and media access.
- Clear prohibition of nudity, sexual content and sexual requests, backed by moderation and enforcement tooling.
- No video processing and no timed live chat.

## Task 5 — ReplyPass VIP

VIP is a recurring creator membership. Creators choose a monthly EUR price, such as €9, €19 or €29. Initial benefits are:

- private creator posts and exclusive updates;
- VIP identity in conversations and creator tools;
- member-only photos/content;
- priority inbox status;
- optional creator-configured request discounts.

VIP does not promise unlimited direct messages or guaranteed replies. Transactional requests remain separately priced unless a creator explicitly offers a defined member discount.

Stripe subscriptions provide recurring billing. ReplyPass records the server-authoritative subscription, invoice and payment states from webhooks; the creator receives 85% and ReplyPass retains 15%, before processor costs. Cancellation, renewal, failed-payment handling, subscriber lists, fan subscription management, content entitlements and creator analytics are required.

VIP price changes create a new immutable Stripe Price. Existing subscribers keep the price they accepted by default; new subscribers receive the current price. Creators may offer an explicit migration, but ReplyPass never silently raises an existing member's recurring price. Disabling VIP stops new subscriptions without erasing history or silently canceling current members.

## Task 6 — launch hardening

Complete admin creator approval, reports and moderation, refunds, payment reconciliation, disputes, transactional email and request notifications, rate limits, fraud controls, analytics, error monitoring, mobile QA, loading/empty/error states, blocking, account deletion, finalized legal/privacy/cookie work, and support-visible transaction history.

Task 6 is a launch gate, not an optional cleanup phase.

## Task 7 — production launch

Complete Stripe live approval and keys, live Connect onboarding and webhooks, production Supabase review, SMTP/domain authentication, the recurring reconciliation scheduler, Apple Pay domain verification, Google Pay validation, controlled real-money payment/transfer/refund tests, SEO and social artwork, creator Instagram-link QA, and final mobile acceptance on `getreplypass.com`.

Live chat, video, tips and credits remain outside V1 until real usage shows that they are worth their operational complexity.
