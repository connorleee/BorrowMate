-- Add RLS policy to allow viewing public items from contacts
-- This enables users to see public items owned by their contacts' linked users

DROP POLICY IF EXISTS "Public items are viewable from contacts" ON public.items;

CREATE POLICY "Public items are viewable from contacts"
  ON public.items FOR SELECT
  USING (
    -- Item must be public
    privacy = 'public'::public.item_privacy
    -- AND current user must have a contact where linked_user_id = item owner
    AND EXISTS (
      SELECT 1 FROM public.contacts
      WHERE contacts.owner_user_id = auth.uid()
      AND contacts.linked_user_id = items.owner_user_id
    )
  );
