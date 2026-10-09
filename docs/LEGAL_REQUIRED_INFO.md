# ReplyPass legal review pack — facts required before paid public launch

**Status: working draft for the owner and qualified French/EU counsel, 27 September 2026.** This is a factual intake and issue list, not approved Terms or an assertion that ReplyPass may lawfully trade. Do not invent an operator, SIREN, VAT number, mediator, tax treatment or address. Record the reviewer, date, jurisdiction and approved document versions before removing the legal launch blocker.

## Product facts established by the application

| Topic | Current implementation to check against final contract language |
| --- | --- |
| Public V1 | Guaranteed Reply and monthly VIP only. New paid voice/photo requests and other proposed products are unavailable. Old records remain. |
| Eligibility | Published Terms say users must be at least 18. That statement is not age verification. |
| Guaranteed Reply | Creator-set EUR price; Stripe authorizes funds. Acceptance alone does not capture. The first qualifying creator reply captures; decline or expiry cancels the authorization. A bank may take time to release a pending hold. The configured reply deadline is at most 24 hours. |
| Price changes | Existing authorized requests keep the original price; new requests use the saved price. |
| VIP | Creator-set monthly price; Mimi's current example is €19/month. Stripe Checkout is intended to allocate 15% to ReplyPass and 85% to the creator. Existing members retain their agreed Stripe Price. Access requires webhook-confirmed active/trialing status and a future paid-through date. VIP does not promise unlimited replies. |
| Cancellation | Intended default is cancellation at period end through Stripe's customer portal. Verify this live setting and consumer flow. Cancellation is not automatically a refund. |
| Refunds and payouts | Admin has a Guaranteed Reply refund/reversal path. A live €4 refund and €3.40 transfer reversal were verified in Stripe and ReplyPass on 9 October; card credit arrival remains to be confirmed. VIP refunds are not automated through that button. Stripe transfer to a connected account and bank payout are distinct events. No bank payout or full VIP lifecycle has yet been certified. |
| Contact | The site displays `info@getreplypass.com`; confirm incoming mail reaches a monitored inbox, beyond the previous successful outbound email test. |

Code evidence: `app/terms/page.tsx`, `app/creator-terms/page.tsx`, `lib/stripe/service.ts`, `lib/vip/server.ts`, `lib/vip/webhooks.ts` and `docs/FINAL_OWNER_LAUNCH_STEPS.md`.

## Facts only the owner can supply or authorize

| Required fact or decision | Status | Purpose |
| --- | --- | --- |
| Legal operator: individual or registered entity; exact legal name, form, country, registration status and number, registered address, public telephone/email and publication director | **OPEN** | Identifies the contracting party and site publisher. Supply SIREN/SIRET/RNE/RCS particulars where applicable. A brand name or Stripe approval is not a substitute. |
| VAT/tax status; who invoices the fan and creator; treatment of ReplyPass's 15% fee; applicable exemptions | **OPEN — owner/accountant** | Checkout, receipts and creator reporting must match the real transaction structure. No VAT number does not itself prove VAT exemption. |
| France Travail position: when the activity begins, your legal role, expected remuneration and how to report it while receiving unemployment benefits | **OPEN — owner with France Travail/adviser** | The owner has said they receive unemployment benefits in France. The personal impact cannot be determined from this repository. Do not route business through another identity/country to evade a decision. |
| Countries allowed for fans and creators | **OPEN** | Determines consumer, tax, privacy and onboarding obligations. Global site access is not a worldwide sales policy. |
| Trader/seller model: who legally sells Guaranteed Reply and VIP, creator professional status and disclosures, who bears refunds/disputes, who issues receipts | **OPEN — counsel/accountant** | Must match Stripe Connect, contracts, checkout and mediator obligations. |
| Competent appointed consumer mediator, name/address/site; customer-complaint contact and process owner | **OPEN — owner engages a scheme** | French consumer-facing professionals must display the mediator's details; the process is free to consumers. |
| Actual Vercel hosting entity/address/contact under the agreement | **OPEN — verify contract** | “Hosted by Vercel” is not a complete legal notice. |
| Monitored support inbox, postal complaint address, refund decision maker, moderation escalation owner | **OPEN** | Published procedures need an operating owner. |

Official references: [Service-Public on individual registration](https://entreprendre.service-public.fr/vosdroits/F36763), [business address](https://entreprendre.service-public.fr/vosdroits/F2160), [France Travail on business creation and ARE](https://www.francetravail.fr/actualites/a-laffiche/2026/are-arce-acre-creer-son-entrepri.html), and [DGCCRF on consumer mediation](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/la-mediation-de-la-consommation-ce-que-vous-devez-savoir).

## Consumer contract and checkout decisions for counsel

1. **Before payment:** approve seller identity, tax-inclusive total price, creator/product description, reply deadline, authorization-versus-charge explanation, release/refund route, and an unambiguous obligation-to-pay action. Give a durable confirmation with agreed terms and support details. [DGCCRF e-commerce guidance](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/e-commerce-les-regles-entre-professionnels-et-consommateurs).
2. **Withdrawal:** classify Guaranteed Reply and VIP as services, digital content or a mixed supply. Decide what right applies during the normal 14-day distance-selling period, whether immediate performance can begin, which separate express request/acknowledgment is required, how withdrawal is exercised, and when an exception genuinely applies. Current conditional Terms text is not checkout consent. [DGCCRF withdrawal guidance](https://www.economie.gouv.fr/particuliers/mes-droits-conso/bien-consommer/vente-distance-tout-savoir-sur-votre-droit-de-retractation).
3. **VIP renewal/termination:** approve monthly billing, existing-member price protection, payment-failure effects and period-end cancellation. Check whether the hosted Stripe portal meets France's easily accessible online subscription-termination requirement for this model or whether an in-site route is needed. [DGCCRF online termination guidance](https://www.economie.gouv.fr/dgccrf/actualites-dgccrf/resilier-ses-contrats-conclus-sur-internet-est-desormais-plus-facile).
4. **Refund allocation:** approve what happens for an empty, abusive, duplicated, late or disputed reply; who bears processing fees, chargebacks and a negative connected-account balance; and whether VIP permits a partial refund. Do not describe a future automated VIP-refund feature as available.
5. **Mediation:** appoint a competent mediator and add its actual details to the Terms/site once engaged. [DGCCRF mediation guidance](https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/la-mediation-de-la-consommation-ce-que-vous-devez-savoir).

## Creator marketplace and safety decisions for counsel

- Decide which creator identity, professional/trader status and contact details must be collected or displayed. Assess whether the marketplace duties of the EU Digital Services Act apply to the exact ReplyPass model, including notice-and-action, reasons/appeals, terms transparency and trader traceability. A report button alone does not settle these duties. [European Commission DSA overview](https://digital-strategy.ec.europa.eu/en/policies/digital-services-act).
- Assess French/EU platform income reporting (DPI-DAC7), needed creator identity/tax information, annual statements and retention. Stripe KYC does not by itself discharge a platform reporting duty. [French tax authority platform guidance](https://www.impots.gouv.fr/transfert-dinformations-en-application-des-dispositifs-dpi-dac7-plateformes-deconomie-collaborative).
- Approve the 18+ rule, ban on nude/sexual requests, reporting/blocking, repeat-offender handling, suspension and appeal process. Keep Community Guidelines aligned with the actual moderation tools.

## Privacy facts and controls to verify

The draft Privacy page lists Supabase, Stripe, Vercel, Resend, Upstash, Google Analytics and Meta. Sentry is configured, but the page still describes error monitoring as future/conditional. Confirm each actual processor, controller/processor role, signed terms, region, subprocessors and non-EEA transfer mechanism. Confirm whether hashed email is sent to Meta and under what consent. Do not send messages, card data or signed media URLs to ads or monitoring.

Approve and **implement** a retention schedule by data category: account/identity, private messages/attachments, VIP posts/media, financial/tax/dispute, support/moderation, security logs, analytics identifiers and consent evidence. For each record purpose, legal basis, active period, archival/legal hold, deletion trigger, deletion job, provider deletion behavior and owner. Do not publish arbitrary numbers until they are enforced. [CNIL retention guidance](https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees), [CNIL transparency guidance](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence).

Keep analytics and advertising choices separate and off until consent, with equally easy refusal and an accessible way to withdraw. The current app remembers a choice for 180 days; verify that live GA4, Meta Pixel and server-side Conversions API respect refusal/withdrawal. [CNIL cookie guidance](https://cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite).

Confirm a monitored privacy address, identity-verification process for access/deletion requests, incident owner, and a process for private-content complaints. `info@getreplypass.com` is only a proposed contact until incoming mail and staffing are verified.

## Code/content issues found — Codex work after wording is approved

| Finding | Current evidence | Required correction |
| --- | --- | --- |
| Fan signup acceptance | `components/auth-form.tsx` creates accounts without a visible Terms/Privacy acknowledgment or saved policy version and timestamp; `profiles.terms_accepted_at` exists but this form does not populate it. | Add linked notices and an auditable acceptance event for the applicable Terms. Provide Privacy information without mislabeling all processing as GDPR consent. |
| Creator terms acceptance | `app/api/creator/onboard/route.ts` writes `community_terms_accepted_at` and a draft version on submission without an explicit Creator Terms/Guidelines acceptance control. | Require a deliberate creator action; store approved version/time only afterward. |
| Checkout withdrawal/performance | Existing Terms defer to “where applicable”; checkout-specific express choices and durable evidence are unverified. | Implement counsel-approved choices after classification and wording are supplied. |
| Legal operator | Terms/Privacy describe ReplyPass as operating from France but do not give a legal name, registration/address or mediator. | Insert verified details and a reviewed legal notice. |
| Privacy accuracy | Error monitoring is phrased as future/conditional although Sentry ingestion was connected. Exact retention and transfer details are absent. | Reconcile the policy with deployment and approved schedule. |
| VIP refund | The Guaranteed Reply refund button does not manage VIP refunds. | Approve a manual VIP refund/transfer-recovery procedure before promising automation. |

## Approval record

| Document/flow | Owner facts received | Reviewer/date | Approved version or commit | Published/mobile checked |
| --- | --- | --- | --- | --- |
| Legal notice/operator | OPEN | OPEN | OPEN | OPEN |
| Fan Terms/checkout/withdrawal | OPEN | OPEN | OPEN | OPEN |
| Creator Terms/Guidelines | OPEN | OPEN | OPEN | OPEN |
| Privacy/retention/cookies | OPEN | OPEN | OPEN | OPEN |
| VIP renewal/cancellation/refund | OPEN | OPEN | OPEN | OPEN |

Do not mark the legal item in `FINAL_OWNER_LAUNCH_STEPS.md` complete until the operator facts, live UI and reviewed wording match. This document is a preparation aid, not professional legal sign-off.
