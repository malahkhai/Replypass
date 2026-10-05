# Creator self-service publishing

Completed profiles with verified email and an active account now enter the existing `approved` eligibility state automatically. This is automatic publication, not an administrator's endorsement or a verification badge. Drafts, unverified accounts and moderation holds remain private. Existing completed applications are migrated only when they meet those conditions; rejected, suspended and under-review creators are not automatically cleared.

Guaranteed Reply and VIP still require an active published creator and Stripe transfer/payout eligibility. Creators control product settings. Connect readiness no longer forces Guaranteed Reply pricing active. VIP enabling and checkout continue enforcing eligibility on the server.

The dashboard uses the saved publication state and links unpublished creators to an authenticated, owner-scoped private preview. The preview is noindex and disables sharing, saving and purchases. Registration says “Publish my ReplyPass.”

## Admin notifications

Database triggers record publication, first live Guaranteed Reply availability, and first live VIP availability in `creator_admin_events`. Sandbox Connect accounts do not generate live product alerts. Active admins receive an in-app notification and an email at their account email, linking to a filtered admin creator record. Admin navigation includes Notifications.

Events are processed after onboarding/product/Connect updates and retried by `/api/cron/payments`. Failed email attempts leave the event pending; successful email and in-app deliveries have stable per-admin idempotency keys. Existing public/paid states are seeded as processed to prevent historical alert floods.

## Validation

84 automated tests, lint, typecheck and production build passed. Local database fixtures checked unverified accounts remain private, verified completed accounts publish, Stripe gates product alerts, retries do not duplicate events, and moderation holds survive profile edits. Fixtures live in tests/sql and run against an isolated empty PostgreSQL database before this migration and then the check script.

Private preview access and mobile/desktop layout were checked in Chrome: anonymous visitors return to login, fans cannot access creator preview, and disabled purchase controls cannot open checkout.
