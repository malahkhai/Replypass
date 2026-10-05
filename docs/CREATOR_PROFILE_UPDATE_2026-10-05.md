# Creator profile update — 5 October 2026

## Delivered
- `/username` is the main creator URL. Existing `/@username` profile and VIP links redirect permanently and preserve query parameters. Static application routes remain reserved; historic conflicting handles retain the `@` path.
- Signup/login return paths, share links, saved creators, membership links and VIP checkout cancellation returns use the clean creator URL.
- Safe HTTPS social links appear directly beneath the creator bio. Creators can add optional per-platform follower counts under Profile → Social links. The total includes only linked accounts with supplied counts, includes the platform breakdown, and states that figures are creator-provided and audiences may overlap. The saved update date changes when the audience or linked accounts change.
- Creators can write a separate public teaser in VIP settings. Their existing VIP description and benefits remain visible before signup. No private post body or media is copied into the teaser.
- Profile and VIP headings use the creator’s name and retain the photo-led layout, with direct Message/VIP actions on phones.

## Verification
- 82 automated tests passed, along with lint, typecheck and production build.
- An isolated local PostgreSQL check passed the additive migration, ownership isolation, invalid-number rejection, teaser length limit and timestamp stability. Production SQL Editor confirmed successful execution and all three new columns.
- Headless Chrome passed old-link 308 redirects with query preservation, clean canonical metadata, creator-context login/signup, reserved login navigation, follower totals and VIP teaser rendering, and no overflow at 390px and 1440px.
- Local screenshots used fictional fixture counts and teaser text; those fixtures are not deployed and no real creator’s follower figures or private posts were changed.

This feature release does not change the outstanding live-payment, actual-phone checkout or legal-review status in the public-launch readiness report.
