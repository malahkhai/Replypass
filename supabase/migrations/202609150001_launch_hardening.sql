-- Task 6: launch operations, moderation, privacy and financial audit records.
alter type public.creator_status add value if not exists 'draft';
alter type public.creator_status add value if not exists 'submitted';
alter type public.creator_status add value if not exists 'under_review';

begin;

alter table public.profiles
  add column if not exists account_status text not null default 'active'
    check (account_status in ('active','suspended','deletion_requested','anonymized')),
  add column if not exists suspended_at timestamptz,
  add column if not exists suspension_reason text check (char_length(suspension_reason) <= 500),
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists anonymized_at timestamptz,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

alter table public.creator_profiles
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists rejection_reason text check (char_length(rejection_reason) <= 500),
  add column if not exists community_terms_accepted_at timestamptz,
  add column if not exists community_terms_version text;

alter table public.reports
  add column if not exists paid_media_delivery_id uuid references public.paid_media_deliveries(id) on delete set null,
  add column if not exists moderator_note text check (char_length(moderator_note) <= 2000),
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;
alter table public.messages add column if not exists moderation_hidden_at timestamptz;
alter table public.vip_posts add column if not exists moderation_hidden_at timestamptz;
alter table public.paid_media_deliveries add column if not exists moderation_hidden_at timestamptz;
alter table public.reports drop constraint if exists reports_status_check;
alter table public.reports add constraint reports_status_check
  check (status in ('open','reviewing','resolved','dismissed','escalated'));
alter table public.reports drop constraint if exists reports_subject;
alter table public.reports add constraint reports_subject
  check (num_nonnulls(reported_profile_id,message_id,request_id,vip_post_id,paid_media_delivery_id)>=1);

alter table public.notifications
  add column if not exists event_key text,
  add column if not exists deep_link text check (deep_link is null or deep_link ~ '^/[a-zA-Z0-9@_/?=&.%-]*$');
create unique index if not exists notifications_event_key_unique
  on public.notifications(recipient_id,event_key) where event_key is not null;
create index if not exists notifications_unread_idx
  on public.notifications(recipient_id,created_at desc) where read_at is null;

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_requests boolean not null default true,
  email_messages boolean not null default true,
  email_payments boolean not null default true,
  email_subscriptions boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  document text not null check(document in ('terms','privacy','creator_terms','community_guidelines')),
  version text not null check(char_length(version) between 1 and 40),
  accepted_at timestamptz not null default now(),
  unique(profile_id,document,version)
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  action text not null check(char_length(action) between 3 and 80),
  target_type text not null check(char_length(target_type) between 2 and 50),
  target_id text not null check(char_length(target_id) between 1 and 160),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_created_idx on public.admin_audit_log(created_at desc);
create index admin_audit_target_idx on public.admin_audit_log(target_type,target_id,created_at desc);

create table public.refund_records (
  id uuid primary key default gen_random_uuid(),
  reply_payment_id uuid not null references public.reply_payments(id),
  initiated_by uuid not null references public.profiles(id),
  reason text not null check(char_length(reason) between 3 and 500),
  amount_cents integer not null check(amount_cents>0),
  currency text not null check(currency in ('eur','usd','gbp')),
  stripe_refund_id text unique,
  stripe_reversal_id text,
  status text not null default 'pending' check(status in ('pending','succeeded','failed','needs_review')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refund_payment_idx on public.refund_records(reply_payment_id,created_at desc);

create table public.stripe_disputes (
  id uuid primary key default gen_random_uuid(),
  stripe_dispute_id text not null unique,
  reply_payment_id uuid references public.reply_payments(id),
  transaction_id uuid references public.transactions(id),
  amount_cents integer not null check(amount_cents>0),
  currency text not null check(currency in ('eur','usd','gbp')),
  reason text,
  status text not null,
  evidence_due_at timestamptz,
  provider_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stripe_disputes_status_idx on public.stripe_disputes(status,provider_created_at desc);

create table public.reconciliation_issues (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check(subject_type in ('payment','transfer','subscription','webhook')),
  subject_id text not null,
  issue_code text not null,
  local_state text,
  provider_state text,
  status text not null default 'open' check(status in ('open','retrying','resolved','manual_review')),
  last_checked_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(subject_type,subject_id,issue_code)
);
create index reconciliation_open_idx on public.reconciliation_issues(status,last_checked_at);

create table public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete set null,
  event_key text not null unique,
  template text not null,
  provider_message_id text,
  status text not null check(status in ('queued','sent','failed','skipped')),
  last_error_code text,
  attempts integer not null default 0 check(attempts>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operational_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  status text not null check(status in ('running','succeeded','failed')),
  processed integer not null default 0,
  attention integer not null default 0,
  error_code text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index operational_runs_job_idx on public.operational_runs(job,started_at desc);

do $$ declare t text; begin
  foreach t in array array['notification_preferences','refund_records','stripe_disputes','reconciliation_issues','email_delivery_events'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
  end loop;
end $$;

-- Operational and financial records are server-only. Admin pages read them through
-- authenticated server routes after a fresh role check, never directly in browsers.
do $$ declare t text; begin
  foreach t in array array['admin_audit_log','refund_records','stripe_disputes','reconciliation_issues','email_delivery_events','operational_runs'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

alter table public.notification_preferences enable row level security;
alter table public.legal_acceptances enable row level security;
revoke all on public.notification_preferences,public.legal_acceptances from anon,authenticated;
grant all on public.notification_preferences,public.legal_acceptances to service_role;
grant select,insert,update on public.notification_preferences to authenticated;
grant select on public.legal_acceptances to authenticated;
create policy notification_preferences_self on public.notification_preferences
  for all to authenticated using(profile_id=(select auth.uid())) with check(profile_id=(select auth.uid()));
create policy legal_acceptances_self on public.legal_acceptances
  for select to authenticated using(profile_id=(select auth.uid()));

-- A user may edit presentation fields only while active. Role and account state are
-- intentionally absent from the browser update grant, preventing self-promotion.
drop policy if exists profiles_edit_self on public.profiles;
create policy profiles_edit_self on public.profiles for update to authenticated
  using(id=(select auth.uid()) and account_status='active')
  with check(id=(select auth.uid()) and account_status='active');

create index if not exists profiles_account_status_idx on public.profiles(account_status,created_at desc);

commit;
