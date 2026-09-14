# Paid voice notes and photos

Task 4 extends the existing secured-request engine; it does not introduce another payment system. The server reads the creator's active price and currency, snapshots the 15% platform fee and 85% creator share, and creates a manual-capture Stripe PaymentIntent. Uploading never captures money.

The acceptance window is 24 hours. Accepting a Voice Note or Photo Request starts a database-authored 48-hour fulfillment window. The existing protected payment cron expires either missed deadline, cancels the authorization idempotently, and marks the request expired.

Voice notes use the private `voice-deliveries` bucket. Photos use the private `paid-deliveries` bucket. Signed upload tokens are issued only after authenticating the owning creator and validating the request state. The delivery endpoint downloads the object through the service role, validates its real container signature, size, MIME type, path, ownership, and deadline, then atomically creates the private media record, entitlement, and capture claim. A capture failure leaves the entitlement unavailable to the fan and flags reconciliation. A transfer failure leaves captured creator earnings owed.

Fan access goes through `/api/account/media/[id]`. The server requires fan ownership, a captured payment, and an available entitlement before returning a five-minute signed URL. Creators may reopen media they delivered; admins remain server-authorized. Signed URLs are never stored. Photos display a subtle transaction-derived ReplyPass watermark overlay; the storage model supports adding a baked derivative later without changing entitlements.

Conversation attachments remain ordinary private chat media and never fulfill Voice Note or Photo Request payments. Their image limit is 10 MB. Paid photos allow 20 MB, and paid voice notes allow 20 MB and five minutes.

Apply `supabase/migrations/202609140001_paid_photo_and_deadlines.sql` before deploying the Task 4 application code.
