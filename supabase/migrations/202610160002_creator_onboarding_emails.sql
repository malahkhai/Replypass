begin;
alter table public.notification_preferences
  add column email_creator_onboarding boolean not null default true;

-- Return only due, eligible accounts without a successfully delivered reminder.
create function public.due_creator_setup_reminders(batch_size integer default 5)
returns table(profile_id uuid)
language sql security definer set search_path = '' as $$
  select p.id
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.creator_profiles c on c.profile_id = p.id
  left join public.notification_preferences n on n.profile_id = p.id
  where p.role = 'creator'
    and p.signup_intent = 'creator'
    and p.account_status = 'active'
    and p.created_at <= now() - interval '48 hours'
    and u.email_confirmed_at is not null
    and coalesce(c.onboarding_complete, false) = false
    and coalesce(n.email_creator_onboarding, true) = true
    and not exists (
      select 1 from public.email_delivery_events e
      where e.event_key = 'creator-onboarding:reminder:' || p.id::text
        and e.status = 'sent'
    )
  order by p.created_at
  limit least(greatest(batch_size, 1), 20)
$$;
revoke all on function public.due_creator_setup_reminders(integer) from public, anon, authenticated;
grant execute on function public.due_creator_setup_reminders(integer) to service_role;
commit;
