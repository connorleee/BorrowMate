-- Fix RLS policy to ensure lenders can always see items they've lent
-- Issue: Items show as "Unknown Item" when lender queries their borrow records
-- Root cause: Existing lender policy may not be working correctly with joins

-- Drop the existing lender policy that uses helper function
DROP POLICY IF EXISTS "Items are viewable by lender" ON public.items;

-- Create a simpler, more direct policy for lender visibility
-- This policy allows viewing items where you're the lender in an active or past borrow record
CREATE POLICY "Items are viewable by lender"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.borrow_records
      WHERE borrow_records.item_id = items.id
      AND borrow_records.lender_user_id = auth.uid()
    )
  );

-- Note: We keep the policy simple and don't use SECURITY DEFINER functions
-- to avoid potential issues with RLS evaluation in joined queries
