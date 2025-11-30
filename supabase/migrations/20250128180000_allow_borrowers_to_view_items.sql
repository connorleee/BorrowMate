-- Allow borrowers to view items they are currently borrowing
-- This fixes the issue where borrowed item names don't populate in the dashboard

CREATE POLICY "Items are viewable by borrowers"
  ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.borrow_records
      WHERE borrow_records.item_id = items.id
      AND borrow_records.borrower_user_id = auth.uid()
      AND borrow_records.status = 'borrowed'
    )
  );
