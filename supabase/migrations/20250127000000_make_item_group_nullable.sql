-- Make group_id nullable in items table
ALTER TABLE public.items ALTER COLUMN group_id DROP NOT NULL;

-- Update RLS policies to allow owners to view/insert their own items regardless of group
-- Existing policy "Items are viewable by group members" only works if group_id is not null and user is member.
-- We need a policy for owners.

CREATE POLICY "Items are viewable by owner"
  ON public.items FOR SELECT
  USING ( auth.uid() = owner_user_id );

-- Existing policy "Group members can create items" requires group membership.
-- We need a policy for creating items without a group (or just generally by owner).
-- But we can't check owner_user_id on INSERT easily if it's not set yet? 
-- Actually, we can check if the new row's owner_user_id is auth.uid().

CREATE POLICY "Users can create their own items"
  ON public.items FOR INSERT
  WITH CHECK ( auth.uid() = owner_user_id );

-- Also need to allow updating if owner (already exists: "Owners can update their items")
-- "Owners can update their items" using ( auth.uid() = owner_user_id ); -> This is good.

-- We might want to allow deleting too?
CREATE POLICY "Owners can delete their items"
  ON public.items FOR DELETE
  USING ( auth.uid() = owner_user_id );
