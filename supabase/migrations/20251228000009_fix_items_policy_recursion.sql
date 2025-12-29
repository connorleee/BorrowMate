-- Fix infinite recursion by using SECURITY DEFINER function for items lender policy
-- Issue: Migration 20251228000002 removed SECURITY DEFINER function, causing circular dependency
-- Root cause: Items policy queries borrow_records, borrow_records policy queries items = infinite loop

-- Drop the problematic policy that directly queries borrow_records
DROP POLICY IF EXISTS "Items are viewable by lender" ON public.items;

-- Recreate using the existing is_lender_of_item() SECURITY DEFINER function
-- This function was created in migration 20250129000010_fix_visibility_rls_recursion.sql
-- SECURITY DEFINER bypasses RLS and prevents circular dependency
CREATE POLICY "Items are viewable by lender"
  ON public.items FOR SELECT
  USING (
    public.is_lender_of_item(id, auth.uid())
  );
