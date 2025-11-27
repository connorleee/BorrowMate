-- Add privacy field to groups table
-- This migration adds support for private and public groups

-- Create group_privacy enum type
create type public.group_privacy as enum ('private', 'public');

-- Add privacy column to groups table with default value 'private'
alter table public.groups
  add column privacy public.group_privacy default 'private'::public.group_privacy not null;

-- Update RLS policy for viewing groups to allow public groups to be viewable by all authenticated users
drop policy if exists "Groups are viewable by members." on public.groups;

create policy "Groups are viewable by members or if public."
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
  );

-- Update membership policy to allow users to join public groups
drop policy if exists "Group creators can insert membership for themselves." on public.group_memberships;

create policy "Users can join public groups or insert their own membership."
  on public.group_memberships for insert
  with check (
    -- Allow if user is joining themselves
    auth.uid() = user_id
    and (
      -- Either the group is public
      exists (
        select 1 from public.groups
        where groups.id = group_memberships.group_id
        and groups.privacy = 'public'
      )
      -- Or they are the creator (for initial membership)
      or exists (
        select 1 from public.groups
        where groups.id = group_memberships.group_id
        and groups.created_by = auth.uid()
      )
    )
  );
