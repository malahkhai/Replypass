begin;

-- PostgREST cannot infer a partial unique index from the notifications
-- upsert's (recipient_id,event_key) conflict target. event_key is nullable,
-- and PostgreSQL's ordinary unique index still allows multiple NULL keys.
drop index if exists public.notifications_event_key_unique;
create unique index notifications_event_key_unique
  on public.notifications(recipient_id, event_key);

commit;
