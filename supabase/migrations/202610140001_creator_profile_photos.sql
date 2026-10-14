begin;

-- Photos are public profile media, uploaded to the existing owner-scoped avatars bucket.
create function private.valid_creator_profile_photos(photos jsonb, owner_id uuid)
returns boolean language plpgsql immutable set search_path = '' as $$
declare photo jsonb;
begin
  if jsonb_typeof(photos) is distinct from 'array' or jsonb_array_length(photos) > 3 then return false; end if;
  for photo in select value from jsonb_array_elements(photos) loop
    if jsonb_typeof(photo) is distinct from 'object'
      or jsonb_typeof(photo->'url') is distinct from 'string'
      or length(photo->>'url') > 2048
      or photo->>'url' not like ('https://%/storage/v1/object/public/avatars/' || owner_id::text || '/%')
      or jsonb_typeof(photo->'x') is distinct from 'number'
      or jsonb_typeof(photo->'y') is distinct from 'number'
      or jsonb_typeof(photo->'scale') is distinct from 'number'
      or (photo->>'x')::numeric not between 0 and 100
      or (photo->>'y')::numeric not between 0 and 100
      or (photo->>'scale')::numeric not between 100 and 200
      or trunc((photo->>'x')::numeric) <> (photo->>'x')::numeric
      or trunc((photo->>'y')::numeric) <> (photo->>'y')::numeric
      or trunc((photo->>'scale')::numeric) <> (photo->>'scale')::numeric
    then return false; end if;
  end loop;
  return true;
end $$;
revoke all on function private.valid_creator_profile_photos(jsonb, uuid) from public;
grant execute on function private.valid_creator_profile_photos(jsonb, uuid) to authenticated, service_role;

alter table public.creator_profiles add column profile_photos jsonb not null default '[]'::jsonb;
alter table public.creator_profiles add constraint creator_profile_photos_valid
  check (private.valid_creator_profile_photos(profile_photos, profile_id));

create or replace function public.save_creator_profile_with_audience(draft jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare creator uuid; counts jsonb; old_links jsonb; photos jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select social_links into old_links from public.creator_profiles where profile_id=auth.uid();
 counts := coalesce(draft->'socialFollowers', '{}');
 if not private.valid_social_followers(counts) then raise exception 'Invalid follower counts'; end if;
 photos := coalesce(draft->'profilePhotos', '[]'::jsonb);
 if not private.valid_creator_profile_photos(photos, auth.uid()) then raise exception 'Invalid profile photos'; end if;
 creator := public.save_creator_profile(draft);
 update public.creator_profiles set
   social_followers_updated_at = case
     when social_followers is distinct from counts or old_links is distinct from draft->'socials'
       then case when counts = '{}'::jsonb then null else now() end
     else social_followers_updated_at end,
   social_followers = counts,
   profile_photos = case when draft ? 'profilePhotos' then photos else profile_photos end
 where id=creator and profile_id=auth.uid();
 return creator;
end $$;

commit;
