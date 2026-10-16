begin;

-- A creator account starts as a creator. A new fan must be attached to a
-- published creator at the instant the auth account is created.
alter table public.profiles
  add column signup_intent text check (signup_intent in ('creator', 'fan')),
  add column fan_creator_id uuid references public.creator_profiles(id),
  add column legacy_signup boolean not null default true,
  add column signup_utm_source text,
  add column signup_utm_medium text,
  add column signup_utm_campaign text;
alter table public.profiles alter column role set default 'creator';

create index profiles_fan_creator_idx on public.profiles(fan_creator_id)
  where fan_creator_id is not null;

create table public.fan_signup_tokens (
  token uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id),
  expires_at timestamptz not null default now() + interval '15 minutes',
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index fan_signup_tokens_expiry_idx on public.fan_signup_tokens(expires_at);
alter table public.fan_signup_tokens enable row level security;
revoke all on public.fan_signup_tokens from anon, authenticated;
grant all on public.fan_signup_tokens to service_role;

-- Existing rows have no reliable signup origin. New rows default to false.
alter table public.profiles alter column legacy_signup set default false;
with known_links as (
  select fan_id, creator_id, created_at, 1 as priority from public.paid_interactions
  union all
  select fan_id, creator_id, created_at, 2 from public.subscriptions
  union all
  select fan_id, creator_id, created_at, 3 from public.saved_creators
), first_link as (
  select distinct on (fan_id) fan_id, creator_id
  from known_links order by fan_id, priority, created_at
)
update public.profiles p set fan_creator_id = f.creator_id
from first_link f where p.id = f.fan_id and p.role = 'fan';
alter table public.profiles add constraint new_fans_have_creator
  check (role <> 'fan' or legacy_signup or fan_creator_id is not null);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  intent text := coalesce(new.raw_user_meta_data->>'signup_intent', 'creator');
  creator_id uuid;
  source text := lower(new.raw_user_meta_data->>'signup_utm_source');
  medium text := lower(new.raw_user_meta_data->>'signup_utm_medium');
  campaign text := lower(new.raw_user_meta_data->>'signup_utm_campaign');
  signup_token uuid;
begin
  if intent not in ('creator', 'fan') then raise exception 'Invalid signup intent'; end if;
  if intent = 'fan' then
    if coalesce(new.raw_user_meta_data->>'fan_signup_token', '') !~
       '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then raise exception 'A creator link is required for fan signup'; end if;
    signup_token := (new.raw_user_meta_data->>'fan_signup_token')::uuid;
    update public.fan_signup_tokens t set consumed_at = now()
      where t.token = signup_token and t.consumed_at is null and t.expires_at > now()
      returning t.creator_id into creator_id;
    if creator_id is null then raise exception 'Creator signup link expired'; end if;
    if not exists (select 1 from public.creator_profiles c
                   where c.id = creator_id and c.status = 'approved'
                     and c.onboarding_complete)
    then raise exception 'Creator link is unavailable'; end if;
  end if;

  insert into public.profiles
    (id, display_name, role, signup_intent, fan_creator_id,
     signup_utm_source, signup_utm_medium, signup_utm_campaign)
  values
    (new.id,
     left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'New friend'), 80),
     case when intent = 'fan' then 'fan'::public.user_role else 'creator'::public.user_role end,
     intent, creator_id,
     case when source ~ '^[a-z0-9][a-z0-9_-]{0,63}$' then source end,
     case when medium ~ '^[a-z0-9][a-z0-9_-]{0,63}$' then medium end,
     case when campaign ~ '^[a-z0-9][a-z0-9_-]{0,63}$' then campaign end);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;

commit;
