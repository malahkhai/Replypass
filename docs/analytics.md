# ReplyPass acquisition measurement plan

GA4 measurement ID: `G-C6DL1WLHDM`. Only `getreplypass.com` and `www.getreplypass.com` send analytics. Localhost and preview hosts never do. Analytics is release-gated: set `NEXT_PUBLIC_GA_ENABLED=true` in Vercel and redeploy only after completing the stream settings below. It is disabled by default. Do not install the supplied snippet separately: it would duplicate tracking and bypass consent.

## Consent

The Google script is absent until analytics is accepted. The Meta script is absent until advertising is separately accepted. Reject optional, accept all and granular choices are available; the footer opens preferences again. Each choice expires after 180 days. Existing GA-only consent does not grant Meta consent. Withdrawal removes accessible cookies for the withdrawn provider and reloads; another tab changing either choice also reloads this tab. Without localStorage, optional tracking remains disabled. Essential authentication storage is unaffected. Google advertising signals remain denied because Google Ads is not configured. This is a small first-party consent interface, not a claim of legal certification. Review the draft privacy policy before commercial launch. A managed CMP can replace this interface later; do not run two banners or duplicate tags.

## Page map

| Route | GA page group |
|---|---|
| `/` | home |
| `/creators` | creator_landing |
| `/@username` | creator_profile |
| `/login`, `/signup` | login, signup |
| `/creator/apply` | creator_onboarding |
| `/creator/dashboard`, `/creator/inbox`, `/creator/requests` | creator_dashboard, creator_inbox, creator_requests |
| `/creator/inbox/[id]` | creator_conversation |
| Other creator workspace sections | creator_section (e.g. creator_earnings) |
| `/account`, `/account/requests` | fan_account, fan_requests |
| Trust pages | terms, privacy, community_guidelines, creator_terms |
| Unrecognized paths and callbacks | other |

GA page views fire once on route change or consent acceptance; queries, hashes, actual titles, usernames and referrers are excluded. Consented Meta Pixel requests use the browser's current URL so Meta can attribute approved campaign parameters such as its click identifier and UTMs. ReplyPass does not copy URL parameters into custom event fields. Never put names, emails, message text or private identifiers in campaign URLs.

## Implemented events

| Event | Trigger | Detail |
|---|---|---|
| `creator_cta_click` | Link to recruitment or application | page_group |
| `interaction_select` | Choose an offering | funnel_detail = offering kind; includes demo exploration |
| `signup_submitted` | Supabase accepts signup request | fan/creator; NOT verified signup (Supabase can conceal existing users) |
| `login` | Successful password login | fan/creator journey |
| `creator_onboarding_start` | Start real onboarding | none |
| `creator_onboarding_step` | Validated next step | step number |
| `creator_launch_success` | Server accepts real creator launch | none; excludes profile editing |
| `checkout_started` | Server returns secured reply quote | message; test-mode checkout, not revenue |

Events are consent-gated and do not replay pre-consent actions. No arbitrary text, errors, form values, IDs or money are sent. No `purchase` event is emitted. Payment authorization is not purchase. Future payment conversions need webhook-confirmed capture, idempotent reporting, consent handling and a separate test/live distinction. Future milestones: verified signup, Connect ready, request authorized, creator reply delivered, payment captured and refund. These are planned, not implemented analytics events.

## Meta Pixel setup and event map

Meta is release-gated and disabled by default. Create one ReplyPass Web dataset/Pixel in Meta Events Manager, then set its numeric public ID as `NEXT_PUBLIC_META_PIXEL_ID` and set `NEXT_PUBLIC_META_ENABLED=true` in Vercel Production. Do not paste a Conversions API token into any `NEXT_PUBLIC_` variable or commit it. Only `getreplypass.com` and `www.getreplypass.com` can send Meta events; localhost and Vercel previews cannot.

| ReplyPass action | Meta event | Conversion use |
|---|---|---|
| Any consented route | `PageView` | Reach and landing views |
| Creator profile | `ViewContent` | Creator-page visits |
| Creator recruitment CTA | `CreatorCTAClick` (custom) | Funnel diagnostic |
| Start creator onboarding | `Lead` | Creator acquisition |
| Creator launch succeeds | `CompleteRegistration` | Creator conversion |
| Choose creator service | `InteractionSelect` (custom) | Fan intent |
| Secured quote created | `InitiateCheckout` | Checkout intent |
| Successful captured payment | `Purchase` | **Not yet emitted**; server confirmation required |

`SignupSubmitted` remains a custom diagnostic event because submitting signup is not proof that an email was verified. ReplyPass custom Meta parameters never include creator handles, fan names, email addresses, message text, request IDs, conversation IDs or payment references. Meta can receive the current page URL after advertising consent for campaign attribution. Browser-side `Purchase` is deliberately absent: the future Conversions API event must come from the idempotent Stripe webhook capture path, carry the server-authoritative amount/currency, respect the user's stored advertising consent and use an `event_id` for deduplication. Authorization, acceptance and a button click are not purchases.

Meta account steps:

1. Events Manager → Connect data → Web → create/select the ReplyPass dataset and Pixel.
2. Add `https://www.getreplypass.com` as the website and copy only the numeric Dataset/Pixel ID into Vercel.
3. Verify ownership of `getreplypass.com` in Meta Business settings using the DNS method supplied by Meta.
4. In Events Manager Test events, open production in a fresh browser, accept Advertising in Cookie preferences and exercise the funnel. Use Meta Pixel Helper to confirm one Pixel and no requests before consent.
5. Configure the web conversion events used for campaigns. Optimize creator campaigns for `CompleteRegistration`; optimize fan campaigns for `Purchase` only after the server-side event is implemented and verified.
6. For Conversions API, generate an access token in Events Manager and store it server-only as `META_CONVERSIONS_API_TOKEN`. Never paste the token into chat, browser code or Git. Pixel ID is public and safe to provide.

## GA4 setup required

1. Admin → Data streams → select this web stream. **Turn off Enhanced measurement** (including automatic history page views, form interactions, outbound clicks and site search). ReplyPass emits its own sanitized events; automatic measurement can collect unsanitized URLs. Do this before deploying.
2. Keep Google Signals and user-provided data collection disabled. Do not add another Google tag through GTM or Vercel.
3. Admin → Custom definitions: create event-scoped dimensions `page_group` and `funnel_detail`.
4. After events arrive, mark `creator_launch_success` as a key event. Do not mark `signup_submitted` as verified signup or checkout as purchase.
5. Explore → Funnel exploration: home/creator_landing → creator_cta_click → signup_submitted (creator) → creator_onboarding_start → creator_launch_success. Fan funnel: creator_profile → interaction_select → signup_submitted/login → checkout_started. Consent refusals, cross-browser email confirmation and blocked analytics naturally make these incomplete.
6. Verify production in Realtime after accepting. Use Google Tag Assistant to inspect all four consent signals. No GA requests should occur in a fresh browser before consent or after rejection. GA4's installation tester does not accept the site's consent prompt, so Basic Consent Mode can make that tester report “not detected” even when the consented integration works correctly.

No GA4 account settings were changed by this code deployment. Reports depend on consent, blockers and GA processing; financial reporting remains in the database/Stripe.
