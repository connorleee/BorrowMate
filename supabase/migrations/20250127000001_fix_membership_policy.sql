-- Fix infinite recursion in group_memberships RLS policy
-- Drop the problematic policy
drop policy if exists "Memberships are viewable by group members." on public.group_memberships;

-- Create helper function to check group membership without triggering RLS
-- This function runs with security definer, bypassing RLS checks
create or replace function public.is_group_member(p_group_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.group_memberships
    where group_id = p_group_id
    and user_id = p_user_id
  );
end;
$$;

-- Create new policy that uses the helper function
-- Users can view their own memberships OR memberships in groups they belong to
create policy "Memberships are viewable by group members."
  on public.group_memberships for select
  using (
    user_id = auth.uid() 
    or public.is_group_member(group_id, auth.uid())
  );
