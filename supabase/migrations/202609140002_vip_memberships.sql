-- Task 5: recurring VIP memberships and private creator posts.
alter type public.subscription_status add value if not exists 'paused';
alter type public.subscription_status add value if not exists 'expired';

begin;

create table public.creator_membership_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creator_profiles(id) on delete cascade,
  enabled boolean not null default false,
  name text not null default 'VIP Membership' check(char_length(name) between 3 and 80),
  description text not null default 'Private posts, exclusive photos and VIP-only updates.' check(char_length(description) between 1 and 300),
  benefits text[] not null default array['Private posts','Exclusive photos','VIP-only updates','VIP badge','Priority fan status'] check(cardinality(benefits) between 1 and 8),
  amount_cents integer not null default 1900 check(amount_cents between 100 and 10000),
  currency text not null default 'eur' check(currency in ('eur','usd','gbp')),
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists plan_id uuid references public.creator_membership_plans(id),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists membership_name text,
  add column if not exists fee_bps integer not null default 1500 check(fee_bps between 0 and 10000),
  add column if not exists fee_cents integer,
  add column if not exists creator_cents integer,
  add constraint subscription_snapshot_valid check(fee_cents is null or (fee_cents>=0 and creator_cents>0 and amount_cents=fee_cents+creator_cents));
create index subscriptions_fan_status_idx on public.subscriptions(fan_id,status,current_period_end desc);
create index subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  stripe_invoice_id text not null unique,
  stripe_payment_intent_id text,
  gross_cents integer not null check(gross_cents>0),
  fee_cents integer not null check(fee_cents>=0),
  creator_cents integer not null check(creator_cents>0),
  fee_bps integer not null check(fee_bps between 0 and 10000),
  currency text not null check(currency in ('eur','usd','gbp')),
  payment_kind text not null check(payment_kind in ('initial','renewal')),
  status text not null check(status in ('paid','failed','refunded','disputed')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(gross_cents=fee_cents+creator_cents)
);
create index subscription_payments_subscription_idx on public.subscription_payments(subscription_id,created_at desc);

create table public.vip_posts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  body text not null default '' check(char_length(body)<=5000),
  visibility text not null default 'vip' check(visibility='vip'),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vip_posts_creator_time_idx on public.vip_posts(creator_id,published_at desc);

create table public.vip_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.vip_posts(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check(size_bytes between 1 and 20971520),
  created_at timestamptz not null default now()
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('vip-media','vip-media',false,20971520,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

alter table public.creator_membership_plans enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.vip_posts enable row level security;
alter table public.vip_post_media enable row level security;
create policy vip_plan_public on public.creator_membership_plans for select to anon,authenticated using(enabled);
create policy vip_plan_owner on public.creator_membership_plans for select to authenticated using(private.owns_creator(creator_id) or private.is_admin());
create policy vip_post_owner on public.vip_posts for all to authenticated using(private.owns_creator(creator_id) or private.is_admin()) with check(private.owns_creator(creator_id) or private.is_admin());
create policy vip_media_owner on public.vip_post_media for all to authenticated using(private.owns_creator(creator_id) or private.is_admin()) with check(private.owns_creator(creator_id) or private.is_admin());
revoke all on public.subscription_payments,public.vip_post_media from anon,authenticated;
grant all on public.creator_membership_plans,public.subscriptions,public.subscription_payments,public.vip_posts,public.vip_post_media to service_role;

create or replace function public.has_active_vip_access(fan uuid, creator uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.subscriptions s where s.fan_id=fan and s.creator_id=creator
   and s.status in ('active','trialing') and (s.current_period_end is null or s.current_period_end>now()));
$$;
revoke all on function public.has_active_vip_access(uuid,uuid) from public,anon,authenticated;
grant execute on function public.has_active_vip_access(uuid,uuid) to service_role;

alter table public.reports add column if not exists vip_post_id uuid references public.vip_posts(id) on delete set null;
alter table public.reports drop constraint if exists reports_subject;
alter table public.reports add constraint reports_subject check(num_nonnulls(reported_profile_id,message_id,request_id,vip_post_id)>=1);

commit;
