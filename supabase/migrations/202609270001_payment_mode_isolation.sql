begin;
alter table public.reply_payments add column if not exists stripe_mode text not null default 'unknown' check (stripe_mode in ('unknown','test','live'));
alter table public.paid_interactions add column if not exists stripe_mode text not null default 'unknown' check (stripe_mode in ('unknown','test','live'));
-- Classify only historical accounts whose mode was explicitly archived and verified.
-- Never infer a mode from a Stripe object ID or from the current API key.
do $$ begin
 if to_regclass('public.creator_stripe_account_archives') is not null then
  execute $q$update public.reply_payments p set stripe_mode=a.mode from public.creator_stripe_account_archives a where p.creator_account_id=a.stripe_account_id and p.creator_id=a.creator_id and a.mode in ('test','live') and p.stripe_mode='unknown'$q$;
 end if;
end $$;
update public.paid_interactions i set stripe_mode=p.stripe_mode from public.reply_payments p where p.interaction_id=i.id and i.stripe_mode='unknown';
create or replace function private.sync_reply_payment_mode() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='UPDATE' and old.stripe_mode <> 'unknown' and new.stripe_mode <> old.stripe_mode then
  raise exception 'Payment mode is immutable';
 end if;
 update public.paid_interactions set stripe_mode=new.stripe_mode where id=new.interaction_id;
 return new;
end $$;
create trigger sync_reply_payment_mode after insert or update of stripe_mode on public.reply_payments for each row execute function private.sync_reply_payment_mode();
create index reply_payment_mode_reconciliation on public.reply_payments(stripe_mode,updated_at) where needs_reconciliation or payment_state in ('pending','authorized','failed');
commit;
