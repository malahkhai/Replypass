# Paid voice notes

Paid voice notes reuse the secured-request payment engine. The fan authorizes the creator's current server-side price snapshot, the creator accepts, records or selects audio, previews it, and explicitly chooses **Deliver voice note**. Acceptance and ordinary chat messages never capture a voice-note payment.

The browser uploads directly to the private `voice-deliveries` bucket through a one-use signed upload URL. The server checks creator ownership, payment state, expiry, MIME allowlist, byte count and container signature. `deliver_voice_note` then commits the media record, pending fan entitlement, delivery record and durable capture claim in one database transaction. Stripe capture starts only after that commit. A confirmed capture activates playback; opening the audio only records `first_viewed_at` and has no financial effect.

Recordings are limited to five minutes and 20 MB. WebM/Opus, M4A/MP4, MP3, OGG and WAV are accepted. Microphone recording is primary; file selection remains available when browser permissions or device support prevent recording. Fan playback uses a five-minute signed URL and the service validates an active entitlement before issuing it.

Apply `supabase/migrations/202609130002_paid_voice_notes.sql` before deploying the matching application commit.
