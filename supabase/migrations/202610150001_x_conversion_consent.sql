-- Existing Meta consent does not authorize X tracking.
alter table public.marketing_consents
  add column x_allowed boolean not null default false;
