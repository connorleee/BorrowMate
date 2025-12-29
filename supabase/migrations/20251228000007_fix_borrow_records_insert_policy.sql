-- Fix borrow_records INSERT policy to support contact-based lending
-- The old policy required group_id, but we made it nullable for contact-based lending

-- Drop old INSERT policy that requires group membership
DROP POLICY IF EXISTS "Group members can create borrow records." ON public.borrow_records;

-- Policy: Users can create borrow records where they are the lender
-- This supports contact-based lending (no group required)
CREATE POLICY "Lenders can create borrow records"
  ON public.borrow_records FOR INSERT
  WITH CHECK (
    auth.uid() = lender_user_id
  );

-- Policy: Group members can create borrow records for group items
-- This maintains group-based lending functionality
CREATE POLICY "Group members can create group borrow records"
  ON public.borrow_records FOR INSERT
  WITH CHECK (
    group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = borrow_records.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );
