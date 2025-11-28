-- Update RLS policy to allow creators to view their own groups
-- This fixes an issue where createGroup fails because the user isn't a member yet

drop policy if exists "Groups are viewable by members or if public." on public.groups;

create policy "Groups are viewable by members, creators, or if public."
  on public.groups for select
  using (
    -- Allow if user is a member
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = groups.id
      and group_memberships.user_id = auth.uid()
    )
    -- OR if the group is public and user is authenticated
    or (privacy = 'public' and auth.uid() is not null)
    -- OR if the user is the creator (needed for initial creation flow)
    or (created_by = auth.uid())
  );

-- Also update the trigger function to be security definer to ensure uniqueness check works globally
create or replace function set_group_invite_code()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.invite_code is null then
    -- Keep trying until we get a unique code
    loop
      new.invite_code := generate_invite_code();
      -- Check if code is unique
      if not exists (select 1 from public.groups where invite_code = new.invite_code) then
        exit;
      end if;
    end loop;
  end if;
  return new;
end;
$$;
