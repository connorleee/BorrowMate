-- Fix infinite recursion in "Items are viewable by borrower" policy
-- Issue: Migration 20251228000003 created this policy with a direct query to borrow_records,
-- which causes recursion when borrow_records INSERT policy queries items.
-- Solution: Use the existing SECURITY DEFINER function is_borrower_of_item() which bypasses RLS.

-- Drop the problematic policy that directly queries borrow_records
DROP POLICY IF EXISTS "Items are viewable by borrower" ON public.items;

-- Recreate using the existing SECURITY DEFINER function (created in 20250129000010)
-- This function bypasses RLS and prevents the circular dependency
CREATE POLICY "Items are viewable by borrower"
  ON public.items FOR SELECT
  USING (
    public.is_borrower_of_item(id, auth.uid())
  );
