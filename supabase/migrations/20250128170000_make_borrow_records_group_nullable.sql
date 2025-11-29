-- Make group_id nullable in borrow_records to support personal item lending
-- This allows users to lend personal items (with null group_id) without group context

ALTER TABLE public.borrow_records
  ALTER COLUMN group_id DROP NOT NULL;

-- Update RLS policies to handle null group_id

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Borrow records are viewable by group members." ON public.borrow_records;

-- Create new SELECT policy that handles both group and personal borrow records
CREATE POLICY "Borrow records are viewable by involved parties or group members."
  ON public.borrow_records FOR SELECT
  USING (
    -- User is lender
    auth.uid() = lender_user_id
    OR
    -- User is borrower
    auth.uid() = borrower_user_id
    OR
    -- User is member of the group (if group_id exists)
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.group_memberships
        WHERE group_memberships.group_id = borrow_records.group_id
        AND group_memberships.user_id = auth.uid()
      )
    )
  );

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Group members can create borrow records." ON public.borrow_records;

-- Create new INSERT policy that handles both group and personal borrow records
CREATE POLICY "Users can create borrow records for items they own."
  ON public.borrow_records FOR INSERT
  WITH CHECK (
    -- User must be the lender
    auth.uid() = lender_user_id
    AND
    -- User must own the item
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = borrow_records.item_id
      AND items.owner_user_id = auth.uid()
    )
    AND
    -- If group_id is set, user must be member of the group
    (
      group_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM public.group_memberships
        WHERE group_memberships.group_id = borrow_records.group_id
        AND group_memberships.user_id = auth.uid()
      )
    )
  );

-- Update existing UPDATE policy to maintain consistency
DROP POLICY IF EXISTS "Lenders or Borrowers can update records (e.g. return)." ON public.borrow_records;

CREATE POLICY "Lenders and borrowers can update their records."
  ON public.borrow_records FOR UPDATE
  USING (
    auth.uid() = lender_user_id
    OR
    auth.uid() = borrower_user_id
  );
