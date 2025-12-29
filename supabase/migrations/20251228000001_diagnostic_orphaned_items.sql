-- Diagnostic query to identify why items show as "Unknown Item" in borrow records
-- This migration adds a diagnostic function to help troubleshoot the issue

-- Function to diagnose borrow_records with missing/invisible items
CREATE OR REPLACE FUNCTION public.diagnose_missing_items()
RETURNS TABLE (
  issue_type text,
  borrow_record_id uuid,
  item_id uuid,
  lender_user_id uuid,
  item_exists boolean,
  item_owner_id uuid,
  lender_matches_owner boolean,
  item_privacy text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN i.id IS NULL THEN 'ITEM_DELETED'
      WHEN br.lender_user_id != i.owner_user_id THEN 'LENDER_OWNER_MISMATCH'
      WHEN i.privacy = 'private' THEN 'ITEM_PRIVATE'
      ELSE 'UNKNOWN_ISSUE'
    END as issue_type,
    br.id as borrow_record_id,
    br.item_id,
    br.lender_user_id,
    (i.id IS NOT NULL) as item_exists,
    i.owner_user_id as item_owner_id,
    (br.lender_user_id = i.owner_user_id) as lender_matches_owner,
    i.privacy as item_privacy
  FROM public.borrow_records br
  LEFT JOIN public.items i ON i.id = br.item_id
  WHERE br.status = 'borrowed'
    AND i.id IS NULL  -- Item doesn't exist
    OR (br.lender_user_id != i.owner_user_id);  -- Lender/owner mismatch
$$;

-- Query to find all orphaned or problematic borrow records
-- Run this in Supabase SQL editor: SELECT * FROM diagnose_missing_items();
