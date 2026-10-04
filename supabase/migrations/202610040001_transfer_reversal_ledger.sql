begin;

-- A completed creator-transfer reversal is a separate movement from the fan refund.
alter table public.transactions drop constraint if exists transactions_kind_check;
alter table public.transactions add constraint transactions_kind_check
  check (kind in ('charge', 'refund', 'fee', 'transfer', 'transfer_reversal', 'dispute'));

-- Stripe may replay refund events after a transfer.reversed event. A confirmed
-- full reversal must not move back to reversal_pending in that ordering.
create function private.preserve_reply_reversal_state() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.transfer_state = 'reversed' and old.stripe_reversal_id is not null
     and new.stripe_reversal_id = old.stripe_reversal_id then
    new.transfer_state := 'reversed';
  end if;
  return new;
end $$;

create trigger preserve_reply_reversal_state
before update of transfer_state, stripe_reversal_id on public.reply_payments
for each row execute function private.preserve_reply_reversal_state();

create function private.record_reply_transfer_reversal() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.transfer_state = 'reversed' and new.stripe_reversal_id is not null
     and (old.transfer_state is distinct from new.transfer_state
          or old.stripe_reversal_id is distinct from new.stripe_reversal_id) then
    insert into public.transactions
      (interaction_id, kind, amount_cents, currency, stripe_event_id, stripe_object_id)
    values
      (new.interaction_id, 'transfer_reversal', new.creator_cents, new.currency,
       'transfer_reversal:' || new.stripe_reversal_id, new.stripe_reversal_id)
    on conflict (stripe_event_id, stripe_object_id, kind) do nothing;
  end if;
  return new;
end $$;

create trigger record_reply_transfer_reversal
after update of transfer_state, stripe_reversal_id on public.reply_payments
for each row execute function private.record_reply_transfer_reversal();

-- Repair any already processed out-of-order refund notifications.
update public.reply_payments
set transfer_state = 'reversed', needs_reconciliation = false
where stripe_reversal_id is not null and transfer_state = 'reversal_pending';

-- Include reversals completed before this migration, including the sandbox refund test.
insert into public.transactions
  (interaction_id, kind, amount_cents, currency, stripe_event_id, stripe_object_id)
select interaction_id, 'transfer_reversal', creator_cents, currency,
       'transfer_reversal:' || stripe_reversal_id, stripe_reversal_id
from public.reply_payments
where transfer_state = 'reversed' and stripe_reversal_id is not null
on conflict (stripe_event_id, stripe_object_id, kind) do nothing;

revoke all on function private.preserve_reply_reversal_state() from public;
revoke all on function private.record_reply_transfer_reversal() from public;

commit;
