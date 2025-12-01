-- Fix infinite recursion in RLS policies for visibility
-- Use SECURITY DEFINER functions to break circular dependencies

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Items are viewable if public and borrowed by user" ON public.items;
DROP POLICY IF EXISTS "Items are viewable by lender" ON public.items;

-- Create helper function to check if user is borrowing an item
-- SECURITY DEFINER bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION public.is_borrower_of_item(item_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.borrow_records
    WHERE borrow_records.item_id = is_borrower_of_item.item_id
    AND borrow_records.borrower_user_id = is_borrower_of_item.user_id
    AND borrow_records.status = 'borrowed'
  );
$$;

-- Create helper function to check if user is lender of an item
CREATE OR REPLACE FUNCTION public.is_lender_of_item(item_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.borrow_records
    WHERE borrow_records.item_id = is_lender_of_item.item_id
    AND borrow_records.lender_user_id = is_lender_of_item.user_id
  );
$$;

-- Add back the policies using helper functions (no recursion)
CREATE POLICY "Items are viewable if public and borrowed by user"
  ON public.items FOR SELECT
  USING (
    privacy = 'public'::public.item_privacy
    AND public.is_borrower_of_item(id, auth.uid())
  );

CREATE POLICY "Items are viewable by lender"
  ON public.items FOR SELECT
  USING (
    public.is_lender_of_item(id, auth.uid())
  );

-- Also fix borrow_records policy that checks items
DROP POLICY IF EXISTS "Borrow records viewable by group members if item public" ON public.borrow_records;

-- Create helper function to check if item is public group item
CREATE OR REPLACE FUNCTION public.is_public_group_item(item_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items
    WHERE items.id = is_public_group_item.item_id
    AND items.group_id IS NOT NULL
    AND items.privacy = 'public'
  );
$$;

-- Recreate borrow_records policy using helper function
CREATE POLICY "Borrow records viewable by group members if item public"
  ON public.borrow_records FOR SELECT
  USING (
    group_id IS NOT NULL
    AND public.is_public_group_item(item_id)
    AND EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = borrow_records.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );
