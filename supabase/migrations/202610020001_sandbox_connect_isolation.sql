-- Preserve the live creator payout record while allowing repeatable Stripe sandbox tests.
begin;

create table public.creator_stripe_sandbox_accounts (
  creator_id uuid primary key references public.creator_profiles(id),
  stripe_account_id text unique,
  ready boolean not null default false,
  transfers_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  requirements_due boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.creator_stripe_sandbox_accounts enable row level security;
revoke all on public.creator_stripe_sandbox_accounts from anon, authenticated;
grant all on public.creator_stripe_sandbox_accounts to service_role;

-- Historic test Connect accounts were archived before the first live onboarding.
-- Restore them only to the sandbox table; the live record is never modified.
do $$ begin
  if to_regclass('public.creator_stripe_account_archives') is not null then
    execute $seed$
      insert into public.creator_stripe_sandbox_accounts
        (creator_id,stripe_account_id,ready,transfers_enabled,payouts_enabled,requirements_due,created_at,updated_at)
      select distinct on (creator_id)
        creator_id,stripe_account_id,
        coalesce((snapshot->>'ready')::boolean,false),
        coalesce((snapshot->>'transfers_enabled')::boolean,false),
        coalesce((snapshot->>'payouts_enabled')::boolean,false),
        coalesce((snapshot->>'requirements_due')::boolean,true),
        coalesce((snapshot->>'created_at')::timestamptz,now()),
        now()
      from public.creator_stripe_account_archives
      where mode='test' and stripe_account_id like 'acct_%'
      order by creator_id,archived_at desc
      on conflict (creator_id) do nothing
    $seed$;
  end if;
end $$;

-- New checkout calls choose the account in the same mode as the Stripe key.
-- Keep the original prepare_reply RPC for already deployed live code.
create function public.prepare_reply_for_mode(
  fan uuid, creator uuid, attempt uuid, content text, fee_basis integer, payment_mode text
) returns public.reply_payments
language plpgsql security definer set search_path='' as $$
declare result public.reply_payments; c public.creator_profiles; price public.creator_pricing;
  account_id text; account_ready boolean; iid uuid; fee integer;
begin
  if payment_mode not in ('test','live') then raise exception 'Invalid payment mode'; end if;
  perform pg_advisory_xact_lock(hashtextextended(fan::text||attempt::text,0));
  select * into result from public.reply_payments where fan_id=fan and attempt_key=attempt;
  if found then
    if result.creator_id<>creator or result.message<>trim(content) or result.stripe_mode<>payment_mode
      then raise exception 'Attempt already used for another request'; end if;
    return result;
  end if;
  select * into c from public.creator_profiles where id=creator;
  if not found or c.profile_id=fan or c.status in ('rejected','suspended')
    or not c.onboarding_complete or not c.accepting_messages
    then raise exception 'Creator unavailable'; end if;
  if exists(select 1 from public.blocks where
    (blocker_id=fan and blocked_id=c.profile_id) or
    (blocker_id=c.profile_id and blocked_id=fan)) then raise exception 'Creator unavailable'; end if;
  if payment_mode='live' then
    select stripe_account_id,ready into account_id,account_ready
      from public.creator_stripe_accounts where creator_id=creator;
  else
    select stripe_account_id,ready into account_id,account_ready
      from public.creator_stripe_sandbox_accounts where creator_id=creator;
  end if;
  if account_id is null or not coalesce(account_ready,false)
    then raise exception 'Complete payout setup first'; end if;
  select * into price from public.creator_pricing where creator_id=creator and kind='message' and active;
  if not found then raise exception 'Guaranteed reply unavailable'; end if;
  if content is null or length(trim(content)) not between 1 and 2000
    or fee_basis is null or fee_basis not between 0 and 9999 then raise exception 'Invalid request'; end if;
  fee:=((price.amount_cents::bigint*fee_basis+5000)/10000)::integer;
  insert into public.paid_interactions
    (fan_id,creator_id,kind,amount_cents,currency,fee_cents,creator_cents,stripe_mode)
    values(fan,creator,'message',price.amount_cents,price.currency,fee,price.amount_cents-fee,payment_mode)
    returning id into iid;
  insert into public.reply_payments
    (interaction_id,fan_id,creator_id,creator_account_id,attempt_key,message,
     gross_cents,fee_cents,creator_cents,fee_bps,currency,stripe_mode)
    values(iid,fan,creator,account_id,attempt,trim(content),
      price.amount_cents,fee,price.amount_cents-fee,fee_basis,price.currency,payment_mode)
    returning * into result;
  return result;
end $$;
revoke all on function public.prepare_reply_for_mode(uuid,uuid,uuid,text,integer,text)
  from public,anon,authenticated;
grant execute on function public.prepare_reply_for_mode(uuid,uuid,uuid,text,integer,text)
  to service_role;

commit;
