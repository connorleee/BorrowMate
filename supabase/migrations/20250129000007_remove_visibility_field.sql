-- Remove visibility field from items table
-- The visibility field (shared|personal) is no longer needed
-- Privacy field (private|public) now controls all visibility

-- Remove the visibility column from items table
ALTER TABLE public.items DROP COLUMN visibility;

-- Drop the item_visibility enum type since it's no longer used
DROP TYPE public.item_visibility;
