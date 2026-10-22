# Animated hero review — local only

Preview: http://127.0.0.1:3101/

## Scope

The homepage's preview is replaced by `AnimatedHeroShowcase`, a small React/CSS component. The headline, form, signup routes and detailed creator carousel are retained. No changes to authentication, payment infrastructure, subscriptions, public creator pages or database code. No new dependencies.

The showcase receives the same first three creator stories as the detailed carousel. It uses public Mimi data when her priced offer is available; otherwise it shows the existing illustrative Luna and Nico examples. This credential-free local checkout uses the latter, without inventing Mimi's current pricing.

## Sequence

A three-second cadence shows profile → priced fan request/card authorization → qualifying reply/payment completion and creator share → optional VIP/private update. The full story finishes before the next creator starts. Transitions use a short crossfade with vertical movement, subtle background drift, and a delayed earnings reveal. Earnings use `splitPayment`, the existing fee helper; €20 yields €17 and €18 yields €15.30 before processing fees and adjustments.

Hover, keyboard focus, manual scene selection, hidden documents and less than 25% viewport intersection stop autoplay. Manual selection pauses until Play is selected. With reduced motion, autoplay and animation are disabled and the initial profile remains visible; scene buttons remain usable. Server-rendered markup already contains the profile before hydration.

Mobile places headline and CTA first, followed by one card. Fixed scene dimensions keep the page stable as scenes change. Existing optimized images are reused.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: 105 passed, 0 failed. Seven new tests cover sequence order, first-five-second request, optional VIP, fee math, hydration/viewport/document gating, reduced-motion gating and interaction pause.
- `npm run build`: passed (webpack production build).
- Browser geometry checks at 320, 375, 390, 430, 768, 1024 and 1440 pixels: no horizontal page overflow, card contained, all scenes fit. On all mobile widths, CTA precedes showcase.
- Browser: manual scene controls and pause/resume checked, automatic creator transitions observed, €20 → €17 inspected, signup username handoff confirmed without creating an account.
- Reduced-motion logic is unit tested and CSS has a matching media query; the browser tool does not provide media-preference emulation, so no emulated reduced-motion browser run is claimed.

## Review assets

Screenshots and browser geometry output: `/private/tmp/replypass-hero-review/`.

Nothing has been pushed, merged or deployed. Start the production preview locally with `npm run start -- --hostname 127.0.0.1 --port 3101` after building.
