-- Migration: Fix users table RLS and add user_profiles view
-- Fixes: RLS-02 - Users table SELECT policy exposes email/phone to all authenticated users
--
-- Problem: The SELECT policy "Public profiles are viewable by everyone." uses USING (true),
-- allowing any authenticated user to read every user's email and phone.
--
-- Solution:
--   1. Replace with owner-only SELECT policy
--   2. Create a restricted view (user_profiles) exposing only id and name for cross-user lookups

-- Part 1: Fix users table SELECT policy
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;

-- Replace with owner-only access
-- (SELECT auth.uid()) subquery form evaluates once per statement, not per row
CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Part 2: Create restricted user_profiles view
-- Limited view exposing only id and name (never email/phone)
-- Used by server actions that need cross-user display names
CREATE VIEW public.user_profiles AS
  SELECT id, name FROM public.users;

-- Allow all authenticated users to read the view
GRANT SELECT ON public.user_profiles TO authenticated;
