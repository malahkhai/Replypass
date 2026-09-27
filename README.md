# ReplyPass

ReplyPass helps fans get closer to the creators they follow. The controlled V1 offers **Guaranteed Reply** (no qualifying reply = no charge) and **VIP Membership** (monthly private posts and updates). Creators get paid for their attention. Paid voice notes, photo/video requests, live chat, tips, wallets and credits are postponed.

Production: [getreplypass.com](https://getreplypass.com). The app uses Next.js 16, Supabase and Stripe Connect. The live Stripe platform has been configured, but this README does **not** certify a real-money end-to-end payment, creator bank payout or legal approval.

## Getting started

Use Node.js 22–24. From a local clone:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Never commit `.env.local` or server secrets. Configure the Supabase URL and public key, server-only service-role key, mode-matched Stripe publishable/secret keys, webhook secrets, app origin, cron secret, shared rate limiter, email provider and monitoring in the target environment. `lib/stripe/config.ts` rejects mixed test/live keys. Local demo fixtures are development-only and cannot create a production transaction.

Apply incremental SQL migrations in filename order. Production has applied `202609270002_vip_access_requires_period.sql` and `202609270003_vip_mode_isolation.sql`; verify their migration history before any new deploy. Run the database authorization suites against a disposable test database, never production.

## V1 financial behavior

For a Guaranteed Reply, the server fetches the creator's current EUR price and snapshots the gross amount, 15% ReplyPass fee and 85% creator share. Stripe authorizes funds first; acceptance does not capture. The first qualifying creator reply captures payment. A protected five-minute job cancels declined/expired authorizations. A captured payment is transferred to the eligible creator; transfer failures remain an amount owed. Admin refunds retain history and reverse/recover the creator transfer where applicable.

For VIP, Stripe Checkout creates a monthly subscription with a 15% application fee and destination to the creator's connected account. New subscribers get the latest saved price; existing subscriptions retain their agreed Stripe Price. Private posts require an active/trialing Stripe-confirmed membership with a future paid-through date. The customer portal is intended to cancel at period end. A real subscription, renewal, failure and cancellation still require owner verification.

Production financial reporting defaults to **live** Guaranteed Reply rows. Preserved sandbox records are tagged `test`, and ambiguous legacy records remain `unknown` rather than being counted as live. Admin can inspect test history separately.

## Verification and release

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

`tests/browser.mjs` and `tests/stripe-browser.mjs` require an available browser/runtime and appropriate test account. See [launch checklist](docs/LAUNCH_CHECKLIST.md), [operations](docs/OPERATIONS.md), [security](docs/SECURITY.md), [legal facts](docs/LEGAL_REQUIRED_INFO.md), and the short [final owner steps](docs/FINAL_OWNER_LAUNCH_STEPS.md). Tests prove code behavior, not a live Stripe settlement or physical-phone wallet experience.
