-- Fix infinite recursion in borrow_requests RLS policies
-- The issue: borrow_requests SELECT policies check items, and items SELECT policies check borrow_records
-- This creates a circular dependency

-- Create SECURITY DEFINER function to check if user owns a borrow request
CREATE OR REPLACE FUNCTION public.user_owns_borrow_request(request_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.borrow_requests
    WHERE borrow_requests.id = user_owns_borrow_request.request_id
    AND borrow_requests.owner_user_id = user_owns_borrow_request.user_id
  );
$$;

-- Create SECURITY DEFINER function to check if user is requester
CREATE OR REPLACE FUNCTION public.user_is_requester(request_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.borrow_requests
    WHERE borrow_requests.id = user_is_requester.request_id
    AND borrow_requests.requester_user_id = user_is_requester.user_id
  );
$$;

-- Drop existing borrow_requests SELECT policies that might cause recursion
DROP POLICY IF EXISTS "Borrow records viewable by lender" ON public.borrow_records;
DROP POLICY IF EXISTS "Borrow records viewable by borrower" ON public.borrow_records;
DROP POLICY IF EXISTS "Borrow records viewable by group members if item public" ON public.borrow_records;

-- Recreate SELECT policies without recursion
-- Policy 1: Lender always sees their own borrow records (no item join needed)
CREATE POLICY "Borrow records viewable by lender"
  ON public.borrow_records FOR SELECT
  USING ( lender_user_id = auth.uid() );

-- Policy 2: Borrower always sees their own borrow records (no item join needed)
CREATE POLICY "Borrow records viewable by borrower"
  ON public.borrow_records FOR SELECT
  USING ( borrower_user_id = auth.uid() );

-- Policy 3: Group members can see group borrow records (simplified, no item check)
CREATE POLICY "Borrow records viewable by group members"
  ON public.borrow_records FOR SELECT
  USING (
    group_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_memberships
      WHERE group_memberships.group_id = borrow_records.group_id
      AND group_memberships.user_id = auth.uid()
    )
  );
