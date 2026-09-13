-- Consent-aware, server-only Meta Conversions API delivery records.
begin;

create table public.marketing_consents (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  allowed boolean not null default false,
  fbp text check (fbp is null or length(fbp) <= 255),
  fbc text check (fbc is null or length(fbc) <= 255),
  client_user_agent text check (client_user_agent is null or length(client_user_agent) <= 500),
  updated_at timestamptz not null default now()
);

create table public.marketing_conversion_events (
  event_id text primary key,
  event_name text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  source_id uuid,
  attempts integer not null default 0,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

alter table public.marketing_consents enable row level security;
alter table public.marketing_conversion_events enable row level security;
revoke all on public.marketing_consents, public.marketing_conversion_events from anon, authenticated;
grant all on public.marketing_consents, public.marketing_conversion_events to service_role;

commit;
