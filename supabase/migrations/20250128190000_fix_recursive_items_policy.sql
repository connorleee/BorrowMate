-- Fix infinite recursion in items RLS policy
-- The previous policy created circular dependency: borrow_records → items → borrow_records
-- Solution: Use a helper function with SECURITY DEFINER to break the recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Items are viewable by borrowers" ON public.items;

-- Create a helper function that checks if a user is borrowing an item
-- SECURITY DEFINER allows it to bypass RLS and prevent recursion
CREATE OR REPLACE FUNCTION public.is_borrowing_item(item_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.borrow_records
    WHERE borrow_records.item_id = is_borrowing_item.item_id
    AND borrow_records.borrower_user_id = is_borrowing_item.user_id
    AND borrow_records.status = 'borrowed'
  );
$$;

-- Create new policy using the helper function
-- This breaks the circular dependency because SECURITY DEFINER bypasses RLS
CREATE POLICY "Items are viewable by active borrowers"
  ON public.items FOR SELECT
  USING (
    public.is_borrowing_item(id, auth.uid())
  );
