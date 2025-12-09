# Groups/:id Page - Use Unified Card Components

## Objective
Update the groups/:id page to use the same `ItemCard` component from the unified card design system instead of inline card styling for displaying group inventory items.

## Background
The items page uses the `ItemCard` component from `components/Card.tsx` for displaying items in a consistent, compact format. The groups/:id page currently uses inline div-based cards (lines 80-98 in `app/groups/[id]/page.tsx`), which doesn't match the rest of the app's design system.

## Tasks

- [ ] Update `app/groups/[id]/page.tsx` to import `ItemCard` component
- [ ] Replace inline card styling (lines 80-98) with `ItemCard` component
- [ ] Map group items to use ItemCard props (name, description, status, etc.)
- [ ] Test the page to ensure items display correctly
- [ ] Run build and lint to verify no errors

## Implementation Notes
- ItemCard supports compact variant (`variant="compact"`)
- ItemCard shows status badges automatically based on status prop
- ItemCard can display owner information and group assignments
- Keep the same grid layout: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
