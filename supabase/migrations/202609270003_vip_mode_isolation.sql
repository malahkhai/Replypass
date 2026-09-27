-- Keep legacy memberships visible for investigation, never silently treat them as live.
begin;
alter table public.subscriptions add column if not exists stripe_mode text not null default 'unknown'
  check (stripe_mode in ('unknown','test','live'));
drop index if exists public.one_live_subscription;
create unique index one_live_subscription on public.subscriptions (fan_id, creator_id, stripe_mode)
  where status in ('incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'paused');
create index subscriptions_mode_status_idx on public.subscriptions (stripe_mode,status,current_period_end);
create or replace function private.guard_subscription_mode() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if old.stripe_mode <> 'unknown' and new.stripe_mode <> old.stripe_mode then
    raise exception 'Subscription mode is immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_subscription_mode on public.subscriptions;
create trigger guard_subscription_mode before update of stripe_mode on public.subscriptions
  for each row execute function private.guard_subscription_mode();
commit;
