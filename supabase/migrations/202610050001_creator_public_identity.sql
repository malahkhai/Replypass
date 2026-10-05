begin;
-- Public, creator-provided audience figures; no private member content is exposed.
create function private.valid_social_followers(counts jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare item record;
begin
 if jsonb_typeof(counts) is distinct from 'object' then return false; end if;
 for item in select * from jsonb_each(counts) loop
  if item.key not in ('instagram','tiktok','youtube','twitter') or jsonb_typeof(item.value) <> 'number' then return false; end if;
  if (item.value::text)::numeric < 0 or (item.value::text)::numeric > 2000000000 or trunc((item.value::text)::numeric) <> (item.value::text)::numeric then return false; end if;
 end loop;
 return true;
end $$;
revoke all on function private.valid_social_followers(jsonb) from public;
grant execute on function private.valid_social_followers(jsonb) to authenticated, service_role;

alter table public.creator_profiles
 add column social_followers jsonb not null default '{}' check (private.valid_social_followers(social_followers)),
 add column social_followers_updated_at timestamptz;
alter table public.creator_membership_plans
 add column public_teaser text not null default '' check (length(public_teaser) <= 500);

-- Wrap the existing owner-checked RPC so profile and audience edits are atomic.
create function public.save_creator_profile_with_audience(draft jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare creator uuid; counts jsonb; old_links jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select social_links into old_links from public.creator_profiles where profile_id=auth.uid();
 counts := coalesce(draft->'socialFollowers', '{}');
 if not private.valid_social_followers(counts) then raise exception 'Invalid follower counts'; end if;
 creator := public.save_creator_profile(draft);
 update public.creator_profiles set
   social_followers_updated_at = case
     when social_followers is distinct from counts or old_links is distinct from draft->'socials'
       then case when counts = '{}'::jsonb then null else now() end
     else social_followers_updated_at end,
   social_followers = counts
 where id=creator and profile_id=auth.uid();
 return creator;
end $$;
revoke all on function public.save_creator_profile_with_audience(jsonb) from public;
grant execute on function public.save_creator_profile_with_audience(jsonb) to authenticated;

create or replace function public.username_available(candidate text) returns boolean
language sql stable security definer set search_path='' as $$
 select candidate ~ '^[a-z0-9_]{3,30}$'
 and (candidate not in ('admin','account','api','auth','creator','creators','login','signup','vip','notifications','privacy','terms','og','replypass','support','about','help','settings','sitemap','robots','legal')
      or exists(select 1 from public.creator_profiles where profile_id=auth.uid() and handle=candidate))
 and not exists(select 1 from public.creator_profiles where handle=candidate and profile_id is distinct from auth.uid());
$$;
commit;
