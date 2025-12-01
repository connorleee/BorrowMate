-- Update RLS policies for items table to enforce privacy-based visibility
-- Privacy field now controls all access, independent from group membership

-- Drop old group-based visibility policy
DROP POLICY IF EXISTS "Items are viewable by group members." ON public.items;

-- Drop old borrower policies (will be replaced with privacy-aware versions)
DROP POLICY IF EXISTS "Items are viewable by borrowers" ON public.items;
DROP POLICY IF EXISTS "Items are viewable by active borrowers" ON public.items;

-- Policy 1: Owner always sees their own items (privacy-agnostic)
-- This policy already exists: "Items are viewable by owner"
-- No change needed

-- Policy 2: Group members can see group items if privacy='public'
CREATE POLICY "Items are viewable by group members if public"
  ON public.items FOR SELECT
  USING (
    group_id IS NOT NULL
    AND privacy = 'public'::public.item_privacy
    AND EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = items.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );

-- Policy 3: Users can see items they are borrowing if privacy='public'
-- (Applies to both personal and group items)
CREATE POLICY "Items are viewable if public and borrowed by user"
  ON public.items FOR SELECT
  USING (
    privacy = 'public'::public.item_privacy
    AND EXISTS (
      SELECT 1 FROM public.borrow_records
      WHERE borrow_records.item_id = items.id
      AND borrow_records.borrower_user_id = auth.uid()
      AND borrow_records.status = 'borrowed'
    )
  );

-- Policy 4: Lenders can always see items they've lent (regardless of privacy)
CREATE POLICY "Items are viewable by lender"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.borrow_records
      WHERE borrow_records.item_id = items.id
      AND borrow_records.lender_user_id = auth.uid()
    )
  );
