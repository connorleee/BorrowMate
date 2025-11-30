-- Migrate existing borrow_records to use contact_id
-- This creates contacts from existing borrow records and links them

-- Step 1: Create contacts for records with borrower_user_id (registered users)
-- For each unique (lender, borrower) combination, create a contact
INSERT INTO public.contacts (owner_user_id, name, email, linked_user_id)
SELECT DISTINCT
  br.lender_user_id,
  u.name,
  u.email,
  br.borrower_user_id
FROM public.borrow_records br
JOIN public.users u ON br.borrower_user_id = u.id
WHERE br.borrower_user_id IS NOT NULL
  AND NOT EXISTS (
    -- Avoid duplicates: check if contact already exists with same owner and linked user
    SELECT 1 FROM public.contacts c
    WHERE c.owner_user_id = br.lender_user_id
    AND c.linked_user_id = br.borrower_user_id
  )
ON CONFLICT DO NOTHING;

-- Step 2: Create contacts for records with only borrower_name (non-users)
-- For each unique (lender, borrower_name) combination, create a contact
INSERT INTO public.contacts (owner_user_id, name)
SELECT DISTINCT
  br.lender_user_id,
  br.borrower_name
FROM public.borrow_records br
WHERE br.borrower_name IS NOT NULL
  AND br.borrower_user_id IS NULL
  AND NOT EXISTS (
    -- Avoid duplicates: check if contact already exists with same owner and name
    SELECT 1 FROM public.contacts c
    WHERE c.owner_user_id = br.lender_user_id
    AND c.name = br.borrower_name
    AND c.linked_user_id IS NULL
  )
ON CONFLICT DO NOTHING;

-- Step 3: Link existing borrow_records to contacts
-- For borrower_user_id records
UPDATE public.borrow_records br
SET contact_id = (
  SELECT c.id FROM public.contacts c
  WHERE c.owner_user_id = br.lender_user_id
  AND c.linked_user_id = br.borrower_user_id
  LIMIT 1
)
WHERE br.borrower_user_id IS NOT NULL
  AND br.contact_id IS NULL;

-- For borrower_name-only records
UPDATE public.borrow_records br
SET contact_id = (
  SELECT c.id FROM public.contacts c
  WHERE c.owner_user_id = br.lender_user_id
  AND c.name = br.borrower_name
  AND c.linked_user_id IS NULL
  LIMIT 1
)
WHERE br.borrower_name IS NOT NULL
  AND br.borrower_user_id IS NULL
  AND br.contact_id IS NULL;

-- Step 4: Verify migration success - check for any orphaned records
-- This will fail if there are any borrow_records without a contact_id
-- (which would indicate a migration problem)
DO $$
DECLARE
  orphaned_count INT;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.borrow_records
  WHERE contact_id IS NULL;

  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Data migration failed: % borrow_records have no contact_id', orphaned_count;
  END IF;
END $$;

-- Step 5: Make contact_id NOT NULL (per decision #3)
ALTER TABLE public.borrow_records
  ALTER COLUMN contact_id SET NOT NULL;

-- Step 6: Ensure foreign key constraint is in place
-- (it should be from migration 20250129000001, but verify)
ALTER TABLE public.borrow_records
  ADD CONSTRAINT fk_borrow_records_contact_id
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE CASCADE
  ON CONFLICT DO NOTHING;
