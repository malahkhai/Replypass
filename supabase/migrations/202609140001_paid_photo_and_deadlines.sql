-- Task 4: shared paid-media requests, two-stage deadlines and private photo delivery.
alter type public.request_status add value if not exists 'fulfilling';
alter type public.request_status add value if not exists 'delivered';

begin;

alter table public.reply_payments
  add column if not exists acceptance_expires_at timestamptz,
  add column if not exists fulfillment_expires_at timestamptz;
alter table public.interaction_requests
  add column if not exists acceptance_expires_at timestamptz,
  add column if not exists fulfillment_expires_at timestamptz;
alter table public.reports add column if not exists request_id uuid references public.interaction_requests(id) on delete set null;
alter table public.reports drop constraint if exists reports_check;
alter table public.reports add constraint reports_subject check (num_nonnulls(reported_profile_id,message_id,request_id)>=1);

alter table public.reply_payments drop constraint if exists secured_interaction_kind;
alter table public.reply_payments add constraint secured_interaction_kind
  check (interaction_kind in ('message','voice_note','photo'));

create table public.paid_media_deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.interaction_requests(id) on delete cascade,
  interaction_id uuid not null unique references public.paid_interactions(id) on delete cascade,
  media_id uuid not null unique references public.media(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id),
  fan_id uuid not null references public.profiles(id),
  delivery_type text not null check (delivery_type in ('voice_note','photo')),
  storage_bucket text not null check (storage_bucket in ('voice-deliveries','paid-deliveries')),
  mime_type text not null,
  file_size bigint not null check (file_size between 1 and 26214400),
  duration_ms integer check (duration_ms is null or duration_ms between 1000 and 300000),
  watermark_text text,
  status text not null default 'pending_capture' check (status in ('pending_capture','available','revoked')),
  delivered_at timestamptz not null default now(),
  available_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((delivery_type='voice_note' and duration_ms is not null) or (delivery_type='photo' and duration_ms is null))
);
create index paid_media_deliveries_fan_idx on public.paid_media_deliveries(fan_id,status,created_at desc);
create index paid_media_deliveries_creator_idx on public.paid_media_deliveries(creator_id,status,created_at desc);
alter table public.paid_media_deliveries enable row level security;
revoke all on public.paid_media_deliveries from anon, authenticated;
grant all on public.paid_media_deliveries to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('paid-deliveries','paid-deliveries',false,20971520,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
update storage.buckets set file_size_limit=10485760 where id='chat-attachments';

create or replace function private.guard_reply_pricing() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.kind in ('message','voice_note','photo') and new.active and not exists(select 1 from public.creator_stripe_accounts where creator_id=new.creator_id and ready) then new.active:=false; end if;
 return new;
end $$;
update public.creator_pricing set active=false where kind in ('message','voice_note','photo') and not exists(select 1 from public.creator_stripe_accounts a where a.creator_id=creator_pricing.creator_id and a.ready);

create function public.prepare_media_request(fan uuid, creator uuid, attempt uuid, content text, interaction_type text, fee_basis integer) returns public.reply_payments
language plpgsql security definer set search_path='' as $$
declare result public.reply_payments; c public.creator_profiles; price public.creator_pricing; acct public.creator_stripe_accounts; iid uuid; fee integer; k public.interaction_kind;
begin
 if interaction_type not in ('voice_note','photo') then raise exception 'Unsupported paid media request'; end if;
 k:=interaction_type::public.interaction_kind;
 perform pg_advisory_xact_lock(hashtextextended(fan::text||attempt::text,0));
 select * into result from public.reply_payments where fan_id=fan and attempt_key=attempt;
 if found then
  if result.creator_id<>creator or result.message<>trim(content) or result.interaction_kind<>interaction_type then raise exception 'Attempt already used for another request'; end if;
  return result;
 end if;
 select * into c from public.creator_profiles where id=creator;
 if not found or c.profile_id=fan or c.status in ('rejected','suspended') or not c.onboarding_complete or not c.accepting_media_requests then raise exception 'Creator unavailable'; end if;
 if exists(select 1 from public.blocks where (blocker_id=fan and blocked_id=c.profile_id) or (blocker_id=c.profile_id and blocked_id=fan)) then raise exception 'Creator unavailable'; end if;
 select * into acct from public.creator_stripe_accounts where creator_id=creator;
 if not found or not acct.ready or acct.stripe_account_id is null then raise exception 'Complete payout setup first'; end if;
 select * into price from public.creator_pricing where creator_id=creator and kind=k and active;
 if not found then raise exception 'This request type is unavailable'; end if;
 if content is null or length(trim(content)) not between 1 and 2000 or fee_basis is null or fee_basis not between 0 and 9999 then raise exception 'Invalid request'; end if;
 fee:=((price.amount_cents::bigint*fee_basis+5000)/10000)::integer;
 insert into public.paid_interactions(fan_id,creator_id,kind,amount_cents,currency,fee_cents,creator_cents) values(fan,creator,k,price.amount_cents,price.currency,fee,price.amount_cents-fee) returning id into iid;
 insert into public.reply_payments(interaction_id,fan_id,creator_id,creator_account_id,attempt_key,message,gross_cents,fee_cents,creator_cents,fee_bps,currency,interaction_kind)
 values(iid,fan,creator,acct.stripe_account_id,attempt,trim(content),price.amount_cents,fee,price.amount_cents-fee,fee_basis,price.currency,interaction_type) returning * into result;
 return result;
end $$;

-- Deadlines are assigned by the database. Accepting starts a fresh 48-hour
-- fulfillment window; browser countdowns never authorize a transition.
create function private.sync_paid_request_deadlines() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.payment_state='authorized' and old.payment_state is distinct from new.payment_state then
  new.acceptance_expires_at:=new.expires_at;
 end if;
 if new.accepted_at is not null and old.accepted_at is null and new.interaction_kind in ('voice_note','photo') then
  new.fulfillment_expires_at:=now()+interval '48 hours';
  new.expires_at:=new.fulfillment_expires_at;
 end if;
 return new;
end $$;
drop trigger if exists sync_paid_request_deadlines on public.reply_payments;
create trigger sync_paid_request_deadlines before update on public.reply_payments for each row execute function private.sync_paid_request_deadlines();

create function private.copy_paid_request_deadlines() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 update public.interaction_requests set
  acceptance_expires_at=new.acceptance_expires_at,
  fulfillment_expires_at=new.fulfillment_expires_at,
  expires_at=coalesce(new.fulfillment_expires_at,new.acceptance_expires_at,new.expires_at),
  updated_at=now()
 where id=new.request_id;
 return new;
end $$;
drop trigger if exists copy_paid_request_deadlines on public.reply_payments;
create trigger copy_paid_request_deadlines after update of acceptance_expires_at,fulfillment_expires_at on public.reply_payments for each row execute function private.copy_paid_request_deadlines();

create function private.initialize_paid_request_deadlines() returns trigger language plpgsql security definer set search_path='' as $$
declare p public.reply_payments;
begin
 select * into p from public.reply_payments where interaction_id=new.interaction_id;
 new.acceptance_expires_at:=coalesce(new.acceptance_expires_at,p.acceptance_expires_at,p.expires_at);
 new.fulfillment_expires_at:=coalesce(new.fulfillment_expires_at,p.fulfillment_expires_at);
 new.expires_at:=coalesce(new.fulfillment_expires_at,new.acceptance_expires_at,new.expires_at);
 return new;
end $$;
drop trigger if exists initialize_paid_request_deadlines on public.interaction_requests;
create trigger initialize_paid_request_deadlines before insert on public.interaction_requests for each row execute function private.initialize_paid_request_deadlines();

create function public.deliver_paid_media(payment uuid, actor uuid, object_path text, mime text, bytes bigint, duration integer default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.reply_payments; owner uuid; mid uuid; marker uuid; bucket text; media_kind public.media_kind; mark text;
begin
 select * into p from public.reply_payments where id=payment for update;
 if not found then raise exception 'Request unavailable'; end if;
 select profile_id into owner from public.creator_profiles where id=p.creator_id;
 if actor is distinct from owner or p.interaction_kind not in ('voice_note','photo') then raise exception 'Not authorized'; end if;
 if p.payment_state<>'authorized' or p.accepted_at is null or p.operation not in ('idle','capture') or coalesce(p.fulfillment_expires_at,p.expires_at)<=now() then raise exception 'Request no longer available'; end if;
 if p.fulfillment_media_id is not null then return jsonb_build_object('payment_id',p.id,'media_id',p.fulfillment_media_id); end if;
 bucket:=case when p.interaction_kind='voice_note' then 'voice-deliveries' else 'paid-deliveries' end;
 media_kind:=case when p.interaction_kind='voice_note' then 'audio'::public.media_kind else 'image'::public.media_kind end;
 if object_path not like p.interaction_id::text||'/'||actor::text||'/%'
  or (p.interaction_kind='voice_note' and (mime not in ('audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav') or bytes not between 1 and 26214400 or duration not between 1000 and 300000))
  or (p.interaction_kind='photo' and (mime not in ('image/jpeg','image/png','image/webp') or bytes not between 1 and 20971520 or duration is not null))
  or not exists(select 1 from storage.objects where bucket_id=bucket and name=object_path)
 then raise exception 'Invalid paid delivery'; end if;
 mark:=case when p.interaction_kind='photo' then 'ReplyPass • '||upper(left(replace(p.interaction_id::text,'-',''),6)) else null end;
 insert into public.messages(conversation_id,sender_id,body) values(p.conversation_id,actor,case when p.interaction_kind='voice_note' then 'Voice note delivered' else 'Photo delivered' end) returning id into marker;
 insert into public.media(owner_id,interaction_id,kind,visibility,storage_path,mime_type,size_bytes) values(actor,p.interaction_id,media_kind,'private',object_path,mime,bytes) returning id into mid;
 insert into public.media_entitlements(interaction_id,media_id,fan_id) values(p.interaction_id,mid,p.fan_id);
 insert into public.paid_media_deliveries(request_id,interaction_id,media_id,creator_id,fan_id,delivery_type,storage_bucket,mime_type,file_size,duration_ms,watermark_text)
 values(p.request_id,p.interaction_id,mid,p.creator_id,p.fan_id,p.interaction_kind,bucket,mime,bytes,duration,mark);
 update public.interaction_requests set status='delivered',updated_at=now() where id=p.request_id;
 update public.reply_payments set fulfillment_media_id=mid,fulfillment_message_id=marker,operation='capture',needs_reconciliation=true,updated_at=now() where id=p.id;
 update public.conversations set updated_at=now() where id=p.conversation_id;
 return jsonb_build_object('payment_id',p.id,'media_id',mid);
end $$;

create or replace function private.sync_voice_entitlement() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.interaction_kind in ('voice_note','photo') and new.payment_state is distinct from old.payment_state then
  if new.payment_state='captured' then
   update public.media_entitlements set status='available',available_at=coalesce(available_at,now()),updated_at=now() where interaction_id=new.interaction_id;
   update public.voice_deliveries set status='available',available_at=coalesce(available_at,now()),updated_at=now() where interaction_id=new.interaction_id;
   update public.paid_media_deliveries set status='available',available_at=coalesce(available_at,now()),updated_at=now() where interaction_id=new.interaction_id;
  elsif new.payment_state in ('canceled','refunded','disputed') then
   update public.media_entitlements set status='revoked',updated_at=now() where interaction_id=new.interaction_id;
   update public.voice_deliveries set status='revoked',updated_at=now() where interaction_id=new.interaction_id;
   update public.paid_media_deliveries set status='revoked',updated_at=now() where interaction_id=new.interaction_id;
  end if;
 end if;
 return new;
end $$;

create function private.notify_paid_request() returns trigger language plpgsql security definer set search_path='' as $$
declare fan uuid; creator_user uuid; kind text;
begin
 select i.fan_id,c.profile_id,i.kind::text into fan,creator_user,kind from public.paid_interactions i join public.creator_profiles c on c.id=i.creator_id where i.id=new.interaction_id;
 if tg_op='INSERT' then
  insert into public.notifications(recipient_id,kind,title,body) values(creator_user,'request','New paid request','A new '||replace(kind,'_',' ')||' request is waiting.');
 elsif new.status is distinct from old.status then
  if new.status='accepted' then insert into public.notifications(recipient_id,kind,title,body) values(fan,'request','Request accepted','Your creator accepted your request.');
  elsif new.status='fulfilled' then insert into public.notifications(recipient_id,kind,title,body) values(fan,'request','Delivery ready','Your paid request is ready.');
  elsif new.status='declined' then insert into public.notifications(recipient_id,kind,title,body) values(fan,'request','Request declined','The reservation is being released. You were not charged.');
  elsif new.status='expired' then insert into public.notifications(recipient_id,kind,title,body) values(fan,'request','Request expired','The request was not completed in time. You were not charged.'); end if;
 end if;
 return new;
end $$;
drop trigger if exists notify_paid_request on public.interaction_requests;
create trigger notify_paid_request after insert or update of status on public.interaction_requests for each row execute function private.notify_paid_request();

create function private.notify_creator_payment() returns trigger language plpgsql security definer set search_path='' as $$
declare creator_user uuid;
begin
 if new.payment_state='captured' and old.payment_state is distinct from new.payment_state then
  select profile_id into creator_user from public.creator_profiles where id=new.creator_id;
  insert into public.notifications(recipient_id,kind,title,body) values(creator_user,'payment','Payment completed','Your earning has been recorded for a completed request.');
 end if;
 return new;
end $$;
drop trigger if exists notify_creator_payment on public.reply_payments;
create trigger notify_creator_payment after update of payment_state on public.reply_payments for each row execute function private.notify_creator_payment();

-- Conversation photos are separate from paid deliverables. They may be shared
-- before or after a request and never trigger capture.
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
 if object_path is not null and (object_path not like conversation::text||'/'||sender::text||'/%' or mime not in ('image/jpeg','image/png','image/webp') or bytes not between 1 and 10485760 or not exists(select 1 from storage.objects where bucket_id='chat-attachments' and name=object_path)) then raise exception 'Invalid attachment'; end if;
 insert into public.messages(conversation_id,sender_id,body) values(conversation,sender,trim(content)) returning id into mid;
 if object_path is not null then insert into public.media(owner_id,message_id,kind,visibility,storage_path,mime_type,size_bytes) values(sender,mid,'image','private',object_path,mime,bytes); end if;
 if p.id is not null and p.interaction_kind='message' and sender=owner and p.fulfillment_message_id is null then perform public.reply_transition(p.id,'reply',sender,jsonb_build_object('message_id',mid)); end if;
 update public.conversations set updated_at=now() where id=conversation;
 return jsonb_build_object('id',mid,'payment_id',case when p.interaction_kind='message' then p.id else null end);
end $$;

revoke all on function public.prepare_media_request(uuid,uuid,uuid,text,text,integer), public.deliver_paid_media(uuid,uuid,text,text,bigint,integer) from public,anon,authenticated;
grant execute on function public.prepare_media_request(uuid,uuid,uuid,text,text,integer), public.deliver_paid_media(uuid,uuid,text,text,bigint,integer) to service_role;
revoke all on function public.send_secured_message(uuid,uuid,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.send_secured_message(uuid,uuid,text,text,text,bigint) to service_role;
revoke all on function private.sync_paid_request_deadlines(),private.copy_paid_request_deadlines(),private.initialize_paid_request_deadlines(),private.notify_paid_request(),private.notify_creator_payment() from public;

commit;
