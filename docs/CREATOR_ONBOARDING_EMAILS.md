# Creator onboarding emails

Creator account creation and public profile publication are separate milestones. The admin Users table now shows whether the creator has verified email, created a profile, and published a page.

- When a creator confirms their email, the auth callback sends a branded setup email if their page is unfinished.
- A separate daily Vercel cron checks verified creator signups at least 48 hours old and sends one reminder only while the page remains unfinished.
- The first successful profile launch sends a branded page-live email containing the exact public URL.
- The admin Users table can send the initial setup email to one eligible creator. This is intended for cases like Teanna, who verified before the automatic flow was deployed. A stable event key prevents repeat delivery.
- Creators can turn off setup reminders in Account settings. All reminder paths check this preference and active account status before delivery.

The email service records each delivery in `email_delivery_events` and sends both HTML and plain text through the existing provider. Apply `202610160002_creator_onboarding_emails.sql` before deploying code that reads the new preference or calls its due-reminders function. The reminder cron is configured at 10:00 UTC daily in `vercel.json`, independently of payment reconciliation, and uses the existing `CRON_SECRET` header.

For the first live check, find Teanna in Admin → Users, confirm the row says `Email verified · page not created`, then select `Send setup email`. Verify a `sent` delivery record for `creator-onboarding:welcome:<profile ID>`. The email's button must open `/creator/apply`. Do not mark the page live until Teanna publishes it herself and `/her-handle` loads publicly.
