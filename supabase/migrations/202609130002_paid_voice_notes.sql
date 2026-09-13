-- Paid voice-note delivery. Uploads remain private and capture is claimed only
-- after a validated object and fan entitlement commit in the same transaction.
begin;

alter table public.reply_payments
  add column interaction_kind public.interaction_kind not null default 'message',
  add column fulfillment_media_id uuid unique references public.media(id),
  add constraint secured_interaction_kind check (interaction_kind in ('message','voice_note'));

create table public.media_entitlements (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references public.paid_interactions(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete cascade,
  fan_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending_capture' check (status in ('pending_capture','available','revoked')),
  available_at timestamptz,
  first_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (interaction_id, fan_id),
  unique (media_id, fan_id)
);

create table public.voice_deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.interaction_requests(id) on delete cascade,
  interaction_id uuid not null unique references public.paid_interactions(id) on delete cascade,
  media_id uuid not null unique references public.media(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id),
  fan_id uuid not null references public.profiles(id),
  duration_ms integer not null check (duration_ms between 1000 and 300000),
  status text not null default 'pending_capture' check (status in ('pending_capture','available','revoked')),
  delivered_at timestamptz not null default now(),
  available_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_entitlements_fan_idx on public.media_entitlements(fan_id, status, created_at desc);
create index voice_deliveries_creator_idx on public.voice_deliveries(creator_id, created_at desc);

alter table public.media_entitlements enable row level security;
alter table public.voice_deliveries enable row level security;
revoke all on public.media_entitlements, public.voice_deliveries from anon, authenticated;
grant all on public.media_entitlements, public.voice_deliveries to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('voice-deliveries','voice-deliveries',false,20971520,array['audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function private.guard_reply_pricing() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.kind in ('message','voice_note') and new.active and not exists(select 1 from public.creator_stripe_accounts where creator_id=new.creator_id and ready) then new.active:=false; end if;
 return new;
end $$;
update public.creator_pricing set active=false where kind in ('message','voice_note') and not exists(select 1 from public.creator_stripe_accounts a where a.creator_id=creator_pricing.creator_id and a.ready);

create or replace function private.immutable_reply_money() returns trigger language plpgsql set search_path='' as $$
begin
 if row(new.interaction_id,new.request_id,new.fan_id,new.creator_id,new.creator_account_id,new.attempt_key,new.message,new.interaction_kind,new.gross_cents,new.fee_cents,new.creator_cents,new.fee_bps,new.currency) is distinct from row(old.interaction_id,old.request_id,old.fan_id,old.creator_id,old.creator_account_id,old.attempt_key,old.message,old.interaction_kind,old.gross_cents,old.fee_cents,old.creator_cents,old.fee_bps,old.currency) then raise exception 'Financial snapshots are immutable'; end if;
 return new;
end $$;

create function public.prepare_voice_note(fan uuid, creator uuid, attempt uuid, content text, fee_basis integer) returns public.reply_payments
language plpgsql security definer set search_path='' as $$
declare result public.reply_payments; c public.creator_profiles; price public.creator_pricing; acct public.creator_stripe_accounts; iid uuid; fee integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(fan::text||attempt::text,0));
 select * into result from public.reply_payments where fan_id=fan and attempt_key=attempt;
 if found then
  if result.creator_id<>creator or result.message<>trim(content) or result.interaction_kind<>'voice_note' then raise exception 'Attempt already used for another request'; end if;
  return result;
 end if;
 select * into c from public.creator_profiles where id=creator;
 if not found or c.profile_id=fan or c.status in ('rejected','suspended') or not c.onboarding_complete or not c.accepting_media_requests then raise exception 'Creator unavailable'; end if;
 if exists(select 1 from public.blocks where (blocker_id=fan and blocked_id=c.profile_id) or (blocker_id=c.profile_id and blocked_id=fan)) then raise exception 'Creator unavailable'; end if;
 select * into acct from public.creator_stripe_accounts where creator_id=creator;
 if not found or not acct.ready or acct.stripe_account_id is null then raise exception 'Complete payout setup first'; end if;
 select * into price from public.creator_pricing where creator_id=creator and kind='voice_note' and active;
 if not found then raise exception 'Voice notes unavailable'; end if;
 if content is null or length(trim(content)) not between 1 and 2000 or fee_basis is null or fee_basis not between 0 and 9999 then raise exception 'Invalid request'; end if;
 fee:=((price.amount_cents::bigint*fee_basis+5000)/10000)::integer;
 insert into public.paid_interactions(fan_id,creator_id,kind,amount_cents,currency,fee_cents,creator_cents) values(fan,creator,'voice_note',price.amount_cents,price.currency,fee,price.amount_cents-fee) returning id into iid;
 insert into public.reply_payments(interaction_id,fan_id,creator_id,creator_account_id,attempt_key,message,gross_cents,fee_cents,creator_cents,fee_bps,currency,interaction_kind)
 values(iid,fan,creator,acct.stripe_account_id,attempt,trim(content),price.amount_cents,fee,price.amount_cents-fee,fee_basis,price.currency,'voice_note') returning * into result;
 return result;
end $$;

create function public.deliver_voice_note(payment uuid, actor uuid, object_path text, mime text, bytes bigint, duration integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.reply_payments; owner uuid; mid uuid; marker uuid;
begin
 select * into p from public.reply_payments where id=payment for update;
 if not found then raise exception 'Request unavailable'; end if;
 select profile_id into owner from public.creator_profiles where id=p.creator_id;
 if actor is distinct from owner or p.interaction_kind<>'voice_note' then raise exception 'Not authorized'; end if;
 if p.payment_state<>'authorized' or p.accepted_at is null or p.operation not in ('idle','capture') or p.expires_at<=now() then raise exception 'Request no longer available'; end if;
 if p.fulfillment_media_id is not null then
  return jsonb_build_object('payment_id',p.id,'media_id',p.fulfillment_media_id);
 end if;
 if object_path not like p.interaction_id::text||'/'||actor::text||'/%'
   or mime not in ('audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav')
   or bytes not between 1 and 20971520 or duration not between 1000 and 300000
   or not exists(select 1 from storage.objects where bucket_id='voice-deliveries' and name=object_path)
 then raise exception 'Invalid voice note'; end if;
 insert into public.messages(conversation_id,sender_id,body) values(p.conversation_id,actor,'Voice note delivered') returning id into marker;
 insert into public.media(owner_id,interaction_id,kind,visibility,storage_path,mime_type,size_bytes) values(actor,p.interaction_id,'audio','private',object_path,mime,bytes) returning id into mid;
 insert into public.media_entitlements(interaction_id,media_id,fan_id) values(p.interaction_id,mid,p.fan_id);
 insert into public.voice_deliveries(request_id,interaction_id,media_id,creator_id,fan_id,duration_ms) values(p.request_id,p.interaction_id,mid,p.creator_id,p.fan_id,duration);
 update public.reply_payments set fulfillment_media_id=mid,fulfillment_message_id=marker,operation='capture',needs_reconciliation=true,updated_at=now() where id=p.id;
 update public.conversations set updated_at=now() where id=p.conversation_id;
 return jsonb_build_object('payment_id',p.id,'media_id',mid);
end $$;

create function private.sync_voice_entitlement() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.interaction_kind='voice_note' and new.payment_state is distinct from old.payment_state then
  if new.payment_state='captured' then
   update public.media_entitlements set status='available',available_at=coalesce(available_at,now()),updated_at=now() where interaction_id=new.interaction_id;
   update public.voice_deliveries set status='available',available_at=coalesce(available_at,now()),updated_at=now() where interaction_id=new.interaction_id;
  elsif new.payment_state in ('canceled','refunded','disputed') then
   update public.media_entitlements set status='revoked',updated_at=now() where interaction_id=new.interaction_id;
   update public.voice_deliveries set status='revoked',updated_at=now() where interaction_id=new.interaction_id;
  end if;
 end if;
 return new;
end $$;
create trigger sync_voice_entitlement after update of payment_state on public.reply_payments for each row execute function private.sync_voice_entitlement();

-- Ordinary conversation messages can fulfill guaranteed replies only. Voice-note
-- payments are fulfilled exclusively by deliver_voice_note above.
create or replace function public.send_secured_message(sender uuid, conversation uuid, content text, object_path text default null, mime text default null, bytes bigint default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.reply_payments; owner uuid; mid uuid;
begin
 select * into p from public.reply_payments where conversation_id=conversation for update;
 if not exists(select 1 from public.conversation_members where conversation_id=conversation and profile_id=sender) then raise exception 'Not authorized'; end if;
 if exists(select 1 from public.blocks b join public.conversation_members m on m.conversation_id=conversation where (b.blocker_id=sender and b.blocked_id=m.profile_id) or (b.blocked_id=sender and b.blocker_id=m.profile_id)) then raise exception 'Conversation unavailable'; end if;
 if content is null or length(trim(content)) not between 1 and 10000 then raise exception 'Invalid message'; end if;
 if p.id is not null and p.interaction_kind='message' then
  select profile_id into owner from public.creator_profiles where id=p.creator_id;
  if p.fulfillment_message_id is null and sender=owner and (p.accepted_at is null or p.expires_at<=now() or p.payment_state<>'authorized' or p.operation<>'idle') then raise exception 'Reply deadline passed or request unavailable'; end if;
 end if;
 if object_path is not null and (object_path not like conversation::text||'/'||sender::text||'/%' or mime not in ('image/jpeg','image/png','image/webp') or bytes not between 1 and 1048576 or not exists(select 1 from storage.objects where bucket_id='chat-attachments' and name=object_path)) then raise exception 'Invalid attachment'; end if;
 insert into public.messages(conversation_id,sender_id,body) values(conversation,sender,trim(content)) returning id into mid;
 if object_path is not null then insert into public.media(owner_id,message_id,kind,visibility,storage_path,mime_type,size_bytes) values(sender,mid,'image','private',object_path,mime,bytes); end if;
 if p.id is not null and p.interaction_kind='message' and sender=owner and p.fulfillment_message_id is null then perform public.reply_transition(p.id,'reply',sender,jsonb_build_object('message_id',mid)); end if;
 update public.conversations set updated_at=now() where id=conversation;
 return jsonb_build_object('id',mid,'payment_id',case when p.interaction_kind='message' then p.id else null end);
end $$;

revoke all on function public.prepare_voice_note(uuid,uuid,uuid,text,integer), public.deliver_voice_note(uuid,uuid,text,text,bigint,integer) from public,anon,authenticated;
grant execute on function public.prepare_voice_note(uuid,uuid,uuid,text,integer), public.deliver_voice_note(uuid,uuid,text,text,bigint,integer) to service_role;
revoke all on function private.sync_voice_entitlement() from public;

commit;
