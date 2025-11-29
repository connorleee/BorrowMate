-- Allow group members to add other users (invite/add member)
-- Policy: "Group members can add new members."

create policy "Group members can add new members."
  on public.group_memberships for insert
  with check (
    exists (
      select 1 from public.group_memberships as gm
      where gm.group_id = group_memberships.group_id
      and gm.user_id = auth.uid()
    )
  );
