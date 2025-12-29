-- Fix RLS policy to ensure borrowers can see items they're borrowing
-- Issue: Items show as "Unknown Item" in "Items I'm borrowing" section
-- Root cause: Existing policy requires privacy='public', but private items should be visible to active borrowers

-- Drop the existing borrower policy that requires public privacy
DROP POLICY IF EXISTS "Items are viewable if public and borrowed by user" ON public.items;

-- Create new policy that allows borrowers to see items regardless of privacy
-- If you're actively borrowing an item, you should be able to see it
CREATE POLICY "Items are viewable by borrower"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.borrow_records
      WHERE borrow_records.item_id = items.id
      AND borrow_records.borrower_user_id = auth.uid()
      AND borrow_records.status = 'borrowed'
    )
  );

-- Note: This allows borrowers to see items they're currently borrowing,
-- regardless of privacy settings. This makes sense because if someone
-- lent you an item, you need to be able to see what it is!
