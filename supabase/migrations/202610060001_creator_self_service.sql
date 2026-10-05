begin;
-- `approved` is the existing eligibility state, now granted automatically only
-- to complete, verified, active accounts. Explicit moderation holds stay intact.
create function private.publish_verified_creator() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('pending','draft','submitted') and new.onboarding_complete
 and exists(select 1 from auth.users u join public.profiles p on p.id=u.id
            where u.id=new.profile_id and u.email_confirmed_at is not null and p.account_status='active')
 then new.status := 'approved'; end if;
 return new;
end $$;
revoke all on function private.publish_verified_creator() from public;
create trigger creator_self_publish before insert or update on public.creator_profiles
for each row execute function private.publish_verified_creator();

create table public.creator_admin_events (
 id uuid primary key default gen_random_uuid(),
 creator_id uuid not null references public.creator_profiles(id) on delete cascade,
 event text not null check(event in ('profile_published','replies_enabled','vip_enabled')),
 created_at timestamptz not null default now(),
 processed_at timestamptz,
 unique(creator_id,event)
);
alter table public.creator_admin_events enable row level security;
grant all on public.creator_admin_events to service_role;
revoke all on public.creator_admin_events from anon, authenticated;

create function private.queue_creator_admin_events() returns trigger
language plpgsql security definer set search_path='' as $$
declare cid uuid; eligible boolean;
begin
 if tg_table_name='creator_profiles' then cid:=new.id; else cid:=new.creator_id; end if;
 select c.status='approved' and c.onboarding_complete and p.account_status='active'
 into eligible from public.creator_profiles c join public.profiles p on p.id=c.profile_id where c.id=cid;
 if not coalesce(eligible,false) then return new; end if;
 insert into public.creator_admin_events(creator_id,event) values(cid,'profile_published') on conflict do nothing;
 if exists(select 1 from public.creator_stripe_accounts where creator_id=cid and ready) then
  if exists(select 1 from public.creator_pricing r join public.creator_profiles c on c.id=r.creator_id where r.creator_id=cid and r.kind='message' and r.active and c.accepting_messages) then
   insert into public.creator_admin_events(creator_id,event) values(cid,'replies_enabled') on conflict do nothing;
  end if;
  if exists(select 1 from public.creator_membership_plans where creator_id=cid and enabled) then
   insert into public.creator_admin_events(creator_id,event) values(cid,'vip_enabled') on conflict do nothing;
  end if;
 end if;
 return new;
end $$;
revoke all on function private.queue_creator_admin_events() from public;
create trigger creator_admin_publication after insert or update on public.creator_profiles for each row execute function private.queue_creator_admin_events();
create trigger creator_admin_pricing after insert or update on public.creator_pricing for each row execute function private.queue_creator_admin_events();
create trigger creator_admin_connect after insert or update on public.creator_stripe_accounts for each row execute function private.queue_creator_admin_events();
create trigger creator_admin_vip after insert or update on public.creator_membership_plans for each row execute function private.queue_creator_admin_events();

-- Do not emit old launch events for existing public creators.
insert into public.creator_admin_events(creator_id,event,processed_at)
select id,'profile_published',now() from public.creator_profiles where status='approved' and onboarding_complete on conflict do nothing;
insert into public.creator_admin_events(creator_id,event,processed_at)
select c.id,'replies_enabled',now() from public.creator_profiles c join public.creator_stripe_accounts a on a.creator_id=c.id and a.ready join public.creator_pricing r on r.creator_id=c.id and r.kind='message' and r.active where c.status='approved' and c.onboarding_complete and c.accepting_messages on conflict do nothing;
insert into public.creator_admin_events(creator_id,event,processed_at)
select c.id,'vip_enabled',now() from public.creator_profiles c join public.creator_stripe_accounts a on a.creator_id=c.id and a.ready join public.creator_membership_plans m on m.creator_id=c.id and m.enabled where c.status='approved' and c.onboarding_complete on conflict do nothing;
-- Existing ordinary applications become public; reviewed/flagged accounts do not.
update public.creator_profiles set status=status where status in ('pending','draft','submitted') and onboarding_complete;

-- Remove the historic policy that exposed unverified pending profiles.
drop policy creators_public on public.creator_profiles;
create policy creators_public on public.creator_profiles for select to anon,authenticated using(status='approved' and onboarding_complete);
drop policy profiles_public_creator on public.profiles;
create policy profiles_public_creator on public.profiles for select to anon,authenticated using(exists(select 1 from public.creator_profiles c where c.profile_id=profiles.id and c.status='approved' and c.onboarding_complete));
drop policy pricing_public on public.creator_pricing;
create policy pricing_public on public.creator_pricing for select to anon,authenticated using(active and exists(select 1 from public.creator_profiles c where c.id=creator_id and c.status='approved' and c.onboarding_complete));
commit;
