-- Aggregate creator link-copy actions by creator, day, and surface.
-- No visitor identifiers or copied URLs are stored.
begin;

create table public.creator_link_copy_days (
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  copied_on date not null default ((now() at time zone 'utc')::date),
  surface text not null check (surface in ('creator_dashboard', 'public_profile')),
  copy_count bigint not null default 0 check (copy_count >= 0),
  primary key (creator_id, copied_on, surface)
);

alter table public.creator_link_copy_days enable row level security;

create policy creator_link_copy_days_owner_select
on public.creator_link_copy_days
for select
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles creator
    where creator.id = creator_link_copy_days.creator_id
      and creator.profile_id = (select auth.uid())
  )
);

create or replace function public.record_creator_link_copy(
  target_creator uuid,
  copy_surface text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if copy_surface not in ('creator_dashboard', 'public_profile') then
    raise exception 'Invalid link-copy surface';
  end if;

  insert into public.creator_link_copy_days (creator_id, copied_on, surface, copy_count)
  select creator.id, (now() at time zone 'utc')::date, copy_surface, 1
  from public.creator_profiles creator
  where creator.id = target_creator
    and creator.onboarding_complete = true
    and creator.status = 'approved'
  on conflict (creator_id, copied_on, surface)
  do update set copy_count = creator_link_copy_days.copy_count + 1;
end;
$$;

revoke all on function public.record_creator_link_copy(uuid, text) from public;
revoke all on function public.record_creator_link_copy(uuid, text) from anon;
revoke all on function public.record_creator_link_copy(uuid, text) from authenticated;
grant execute on function public.record_creator_link_copy(uuid, text) to service_role;

commit;
