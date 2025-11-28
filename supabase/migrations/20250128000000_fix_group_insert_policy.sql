-- Fix group creation RLS policy
-- This ensures users can create groups where they are the creator

drop policy if exists "Users can create groups." on public.groups;

create policy "Users can create groups."
  on public.groups for insert
  with check ( auth.uid() = created_by );
