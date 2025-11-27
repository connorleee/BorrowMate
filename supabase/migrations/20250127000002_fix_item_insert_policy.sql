-- Fix INSERT policy for items to handle NULL group_id
-- The existing "Group members can create items" policy fails when group_id is NULL
-- because it tries to check group membership on a NULL group_id

-- Drop the old policy that doesn't handle NULL group_id
DROP POLICY IF EXISTS "Group members can create items." ON public.items;

-- Recreate the policy to handle NULL group_id
-- Items with a group_id require group membership
-- Items without a group_id (NULL) can be created by the owner
CREATE POLICY "Group members can create items."
  ON public.items FOR INSERT
  WITH CHECK (
    -- If group_id is NULL, allow if user is the owner
    (group_id IS NULL AND auth.uid() = owner_user_id)
    -- If group_id is set, require group membership
    OR (
      group_id IS NOT NULL
      AND exists (
        select 1 from public.group_memberships
        where group_memberships.group_id = items.group_id
        and group_memberships.user_id = auth.uid()
      )
    )
  );
