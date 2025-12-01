-- Update RLS policies for borrow_records to respect item visibility
-- Group members can only see borrow records for items with privacy='public'

-- Drop old group-based visibility policy
DROP POLICY IF EXISTS "Borrow records are viewable by group members." ON public.borrow_records;

-- Policy 1: Lender always sees their own borrow records
CREATE POLICY "Borrow records viewable by lender"
  ON public.borrow_records FOR SELECT
  USING ( auth.uid() = lender_user_id );

-- Policy 2: Borrower always sees their own borrow records
CREATE POLICY "Borrow records viewable by borrower"
  ON public.borrow_records FOR SELECT
  USING ( auth.uid() = borrower_user_id );

-- Policy 3: Group members can see borrow records for public group items
CREATE POLICY "Borrow records viewable by group members if item public"
  ON public.borrow_records FOR SELECT
  USING (
    group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = borrow_records.item_id
      AND items.privacy = 'public'::public.item_privacy
    )
    AND EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = borrow_records.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );
