create or replace function public.has_active_vip_access(fan uuid, creator uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.subscriptions s where s.fan_id=fan and s.creator_id=creator
   and s.status in ('active','trialing') and s.current_period_end>now());
$$;
revoke all on function public.has_active_vip_access(uuid,uuid) from public,anon,authenticated;
grant execute on function public.has_active_vip_access(uuid,uuid) to service_role;
