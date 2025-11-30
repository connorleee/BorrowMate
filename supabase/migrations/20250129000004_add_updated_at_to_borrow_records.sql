-- Add updated_at timestamp to borrow_records per CLAUDE.md spec
ALTER TABLE public.borrow_records
  ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create index on updated_at for sorting/filtering
CREATE INDEX idx_borrow_records_updated_at ON public.borrow_records(updated_at);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_borrow_records_updated_at
BEFORE UPDATE ON public.borrow_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
