-- Add contact_id to borrow_records for contact-centric lending model
ALTER TABLE public.borrow_records
  ADD COLUMN contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE;

-- Create index for quick lookups
CREATE INDEX idx_borrow_records_contact_id ON public.borrow_records(contact_id);

-- Update existing RLS policies to handle contact-based records

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Borrow records are viewable by involved parties or group members." ON public.borrow_records;

-- New SELECT policy: Users can view if they are lender, borrower, contact owner, or group member
CREATE POLICY "Borrow records are viewable by involved parties."
  ON public.borrow_records FOR SELECT
  USING (
    -- User is lender
    auth.uid() = lender_user_id
    OR
    -- User is borrower
    auth.uid() = borrower_user_id
    OR
    -- User is the contact owner
    (
      contact_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.contacts
        WHERE contacts.id = borrow_records.contact_id
        AND contacts.owner_user_id = auth.uid()
      )
    )
    OR
    -- User is member of the group (if group_id exists)
    (
      group_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.group_memberships
        WHERE group_memberships.group_id = borrow_records.group_id
        AND group_memberships.user_id = auth.uid()
      )
    )
  );

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create borrow records for items they own." ON public.borrow_records;

-- New INSERT policy: Users must own the item; contact_id must be their contact
CREATE POLICY "Users can create borrow records for items they own with their contacts."
  ON public.borrow_records FOR INSERT
  WITH CHECK (
    -- User must be the lender
    auth.uid() = lender_user_id
    AND
    -- User must own the item
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = borrow_records.item_id
      AND items.owner_user_id = auth.uid()
    )
    AND
    -- If contact_id is set, user must own the contact
    (
      contact_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM public.contacts
        WHERE contacts.id = borrow_records.contact_id
        AND contacts.owner_user_id = auth.uid()
      )
    )
    AND
    -- If group_id is set, user must be member of the group
    (
      group_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM public.group_memberships
        WHERE group_memberships.group_id = borrow_records.group_id
        AND group_memberships.user_id = auth.uid()
      )
    )
  );
