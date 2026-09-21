# ReplyPass production launch runbook

Task 7 keeps the launch product limited to Guaranteed Reply, Voice Note, Photo Request, and VIP. Live Chat, Video, Tips, wallets, and credits are not launch products.

## Automated release gates

`GET /api/health` reports whether required operational configuration is present without exposing secrets. An admin can inspect the detailed readiness result at `GET /api/admin/payments/readiness`.

Production is launch-ready only when:

- Supabase, email, rate limiting, cron, both Stripe webhook secrets, and the canonical production URL are configured.
- Stripe publishable and secret keys are a matching live pair and `STRIPE_MODE=live`.
- GA4, Meta measurement, and error monitoring are enabled.
- demo mode is disabled.

Test and live Stripe objects must never be mixed. Switch all Stripe keys and webhook secrets together in one deployment.

## Owner-controlled Stripe activation

The owner must complete Stripe business verification and Connect marketplace approval, then create live webhook destinations for `https://getreplypass.com/api/stripe/webhook`. Add the resulting live keys and webhook secrets to Vercel Production, set `STRIPE_MODE=live`, and redeploy.

Do not enable public acquisition until a real creator has completed Connect onboarding and Stripe shows both charges and payouts enabled. Resolve every current or future verification requirement shown by Stripe.

## Real-money acceptance tests

Run these with a deliberately small amount and record the Stripe IDs, ReplyPass payment/request IDs, timestamps, and outcomes. Compare Stripe, Supabase, and the ReplyPass admin UI after each case.

1. Guaranteed Reply: authorize, accept, send first reply, confirm capture, 15% fee snapshot, 85% creator transfer, conversation access, and receipt emails.
2. Decline: authorize, creator declines, confirm authorization cancellation and no earning.
3. Expiry: authorize, leave unfulfilled, confirm the five-minute scheduler releases the authorization and records expiry.
4. Refund: capture a completed request, issue an admin refund, confirm refund record and transfer reversal/accounting.
5. Voice Note: authorize, accept, record/upload valid private media, deliver, create fan entitlement, capture, transfer, and confirm the signed URL expires.
6. Photo Request: repeat the Voice Note checks with a valid private image.
7. VIP: subscribe, confirm access and creator earning, cancel at period end, confirm access remains through the period, then confirm removal. Test a failed renewal separately.

Any disagreement between Stripe, Supabase, or the UI blocks launch. Real transactions, refunds, and transfer reversals require the owner to initiate or approve them.

## Controlled release

Keep `LAUNCH_MODE=private` while testing with the owner and founding creators. Creator applications remain subject to admin approval. Onboard 5–10 founding creators, complete phone testing through the Instagram in-app browser, and obtain legal review of Terms, Privacy, Creator Terms, Community Guidelines, cookies, refunds, cancellations, and marketplace language before broad promotion.

The final phone path is: Instagram creator link → creator profile → fan signup/confirmation → payment → request → delivery → fan account.
