-- Add missing item fields per CLAUDE.md spec
CREATE TYPE public.item_ownership_type AS ENUM ('owner', 'shared');

ALTER TABLE public.items
  ADD COLUMN ownership_type public.item_ownership_type DEFAULT 'owner'::public.item_ownership_type,
  ADD COLUMN qr_slug text,
  ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Create unique index for qr_slug (optional, for quick lookups)
CREATE UNIQUE INDEX idx_items_qr_slug ON public.items(qr_slug) WHERE qr_slug IS NOT NULL;

-- Create index on updated_at
CREATE INDEX idx_items_updated_at ON public.items(updated_at);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
