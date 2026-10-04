# Task 3.5 — real Stripe sandbox validation

This document separates verified code/database facts from external sandbox results. Never mark a row passed from mocks, a browser redirect, or a manually edited database value.

## Current readiness evidence (2026-09-11)

| Check                          | Result             | Evidence                                                                                                              |
| ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Supabase payment schema        | Pass               | Required table/column fingerprints for migrations 005 and 006 respond through the service API                         |
| Published real creator         | Pass               | One Supabase creator is published; demo Stella is excluded                                                            |
| Separate real fan              | Blocked            | Production currently has no second fan profile                                                                        |
| Stripe test keys               | Blocked            | All Stripe variables are absent locally; Vercel CLI is not authenticated, so hosted values could not be inspected     |
| Connected account              | Blocked            | `creator_stripe_accounts` contains zero records                                                                       |
| Apex webhook URL               | Blocked            | POST to `getreplypass.com/api/stripe/webhook` redirects to `www`; direct unsigned POST to `www` correctly returns 400 |
| Webhook signature/replay       | Partially verified | Raw signature, timestamp, event inbox and idempotency are automated; real Stripe delivery/replay is blocked           |
| Authorization/capture/transfer | Blocked            | No real Stripe sandbox credentials or eligible connected account                                                      |
| Decline/expiry release         | Blocked externally | Provider mocks and SQL transitions pass; no real authorization exists to release                                      |

Run `npm run payment:readiness` after configuration. It reports only key shapes, counts, booleans and HTTP status; it never prints environment values, user identifiers or Stripe object IDs. The authenticated admin endpoint `/api/admin/payments/readiness` provides the same safe configuration/schema class of information for a deployed build.

## Required external setup before the proof run

1. In Vercel, make `getreplypass.com` the primary domain so the exact webhook URL responds directly. If `www` must remain primary, register `https://www.getreplypass.com/api/stripe/webhook` in Stripe and update the documented production endpoint decision consistently.
2. Add valid sandbox values for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`, and a 32+ character `CRON_SECRET`. Add them together and redeploy. Never paste them into source control or chat.
3. Configure the two event destinations exactly as listed in `docs/setup.md`. Snapshot and Accounts v2 thin destinations can deliver to the same final URL, but each has its own signing secret.
4. Sign into the real creator, complete `/creator/payouts`, then confirm transfers and payouts are active with no user-action requirements. Only Stripe state can set readiness. Enable Guaranteed Reply afterward in `/creator/profile`.
5. Create a separate real fan through the creator’s `@username` page. Use only Stripe test cards.
6. Configure a trusted five-minute scheduler for the protected cron route. For the expiry proof, temporarily set `REPLY_EXPIRY_SECONDS=60`, redeploy, authorize a fresh request, wait past expiry, invoke the cron with its bearer secret, then restore `86400` and redeploy.

## Evidence to record for each scenario

For success, record the internal request/payment UUID and confirm its PaymentIntent, Charge, Transfer, connected account, amount, currency, fee/net snapshot and timestamps agree in Stripe and Supabase. Do not paste card data, secrets, message content, user email, or raw webhook bodies into this document.

| Scenario         | Required proof                                                                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Success          | `requires_capture` after authorization and after Accept; one conversation; one fulfillment claim; one €4 capture; one €3.40 transfer; €0.60 platform snapshot; matching IDs/timestamps; second simultaneous reply creates no second financial operation |
| Decline          | PaymentIntent canceled; request declined; all earnings zero; repeated Decline is safe                                                                                                                                                                   |
| Expiry           | PaymentIntent canceled after protected cron; request expired; all earnings zero; test both unaccepted and accepted-without-reply                                                                                                                        |
| Failed card      | No active creator request and no earnings                                                                                                                                                                                                               |
| SCA              | Authentication completes into `requires_capture`, or failure leaves no active request                                                                                                                                                                   |
| Duplicate/replay | Same checkout attempt, double Accept, double Decline, refresh and webhook resend create no duplicate order, conversation, capture, transfer or ledger entries                                                                                           |

Final Task 3.5 completion requires filling these rows with actual sandbox evidence. Automated provider tests remain supporting evidence, not a substitute.

## Sandbox Guaranteed Reply proof — 2026-10-03

The success path was exercised on the Vercel Preview deployment with a separate fan and Mimi creator session. This is **sandbox evidence**, not a live-money launch check.

| Check | Result | Evidence |
| --- | --- | --- |
| Authorization | Pass | Stripe test PaymentIntent `pi_3UMS7NDchEyzQeVt1wFZyEqF` showed €4.00 uncaptured after the fan submitted request `98ee554e-6186-4414-aa00-f153d58b69a5`. |
| Acceptance | Pass | Accept opened conversation `e8a299e0-6c39-4d62-ae2f-f3e3ac8a034e`; the creator UI still displayed €4.00 secured and €3.40 to earn. |
| First reply and capture | Pass | Stripe showed the €4.00 charge `ch_3UMS7NDchEyzQeVt1XcHKqUP` captured at 13:21 UTC, with a 200 response for the capture API call. |
| Creator transfer | Pass | Stripe showed a €3.40 transfer `tr_3UMS7NDchEyzQeVt1EjH16au` to connected account `acct_1UEXiLDchEYc0rAA`, sourced from the captured charge. |
| Local accounting | Pass | Payment `7f018396-2319-4181-8d9e-68d525969441` was `captured` / `transferred` in `test` mode, with €4.00 gross, €0.60 platform fee, €3.40 creator share, and `needs_reconciliation=false`. |
| Webhooks | Pass | Signed `payment_intent.succeeded` and `transfer.created` events were processed once each in `stripe_webhook_events`. The Stripe Preview destination showed three deliveries and zero failures. |
| Fan account view | Pass | In the fan's Preview account, Messages showed Mimi's reply and Requests showed the new Guaranteed Reply as “Replied” and “Charged €4.00,” with 0 active requests. |

The Stripe test dashboard displayed €0.38 in processing fees on this charge; the platform's €0.60 fee snapshot is before that processing cost.

## Sandbox decline proof — 2026-10-03

| Check | Result | Evidence |
| --- | --- | --- |
| New authorization | Pass | Fan request `c451d15c-3c17-402a-b447-0a1bf675571c` appeared as a €4.00 reservation. Stripe test PaymentIntent `pi_3UMTx9DchEyzQeVt129YUv37` showed an uncaptured authorization. |
| Creator decline | Pass | Mimi's Preview request moved from Pending to Declined without acceptance or delivery. |
| Authorization release | Pass | Stripe marked the PaymentIntent Canceled, recorded a successful cancel API call, and showed €0.00 net. The payment record `9d78ff19-9a9d-4c9b-a72f-04f17a85ca26` was `canceled` in `test` mode with no captured charge, no transfer, and no reconciliation flag. |
| Fan account view | Pass | Akin's Preview request changed to “Declined” and “NOT CHARGED €4.00”; active requests fell to zero. |

Expiry, duplicate/replay, failed-card and SCA paths remain unverified in this sandbox proof.

## Sandbox refund and creator-transfer reversal — 2026-10-04

The admin refunded the previously captured €4.00 Guaranteed Reply through a genuine Vercel Preview deployment (`replypass-4w6klnksl-akinola-akintundes-projects.vercel.app`). Vercel inspection confirmed this deployment targets **preview**; the older `replypass-git-main-akinola-akintundes-projects.vercel.app` alias now targets **production** and must not be used for sandbox mutations.

| Check | Result | Evidence |
| --- | --- | --- |
| Admin refund | Pass | `refund_records` has a succeeded €4.00 record and `admin_audit_log` records `payment.refund` for payment `7f018396-2319-4181-8d9e-68d525969441`. |
| Payment and creator transfer | Pass | The test-mode payment is `refunded` / `reversed`, with Stripe refund `re_3UMS7NDchEyzQeVt1qQBTEd2`, transfer reversal `trr_1UMl0tDchEyzQeVtqJPfKZhb`, and `needs_reconciliation=false`. |
| Financial split and interaction | Pass | The immutable split remains €4.00 gross, €0.60 ReplyPass fee and €3.40 creator share; the linked interaction is `refunded`. The transaction ledger contains the original charge, fee and transfer plus the €4.00 refund. |
| Fan presentation | Code/database verified | The fan request card maps `payment_state=refunded` to “Your payment was refunded”; the live browser view was not observed after this action. |
| Stripe dashboard | Pass | Stripe's sandbox event payload confirms the €4.00 charge was fully refunded and the €3.40 transfer was fully reversed (`amount_reversed=340`, `livemode=false`). |
| Webhook destinations | Corrected | Both sandbox payment and Connect destinations now use the verified Preview deployment. The former `git-main` alias targets production. Live destinations were not changed. |
| Webhook deliveries | Pass | Before correction, refund and reversal deliveries received HTTP 400 from the production-targeting alias. Replayed `refund.updated`, `refund.created`, `transfer.reversed`, and `charge.refunded` events each returned HTTP 200 from Preview. All four event IDs now have `processed_at` and one processing attempt in Supabase's webhook inbox. |

The replay exposed an out-of-order transition bug: after `transfer.reversed` was processed, a later `charge.refunded` replay changed `transfer_state` back to `reversal_pending`, even though the Stripe reversal ID remained saved and `needs_reconciliation=false`. Migration `202610040001_transfer_reversal_ledger.sql` was applied through Supabase SQL Editor on 2026-10-04. A subsequent service-role read verified the test payment is now `refunded` / `reversed` with `needs_reconciliation=false`, and its ledger has exactly one €3.40 `transfer_reversal` entry for Stripe reversal `trr_1UMl0tDchEyzQeVtqJPfKZhb`. A disposable PostgreSQL test also verified repair, backfill, a new reversal and a late replay without duplicating the ledger entry.
