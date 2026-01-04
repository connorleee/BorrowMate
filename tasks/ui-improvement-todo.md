# UI Improvement Todo

## Phase 1: Root Layout Fix
- [x] Fix `app/layout.tsx` - change `px-3` to `px-4 md:px-6`, simplify nested gaps

## Phase 2: Dark Mode Fixes
- [x] Fix `app/discover/page.tsx` - remove custom layout, use CSS variables
- [x] Fix `app/users/[id]/page.tsx` - remove custom layout, use CSS variables
- [x] Fix `app/page.tsx` - replace hardcoded grays
- [x] Fix `app/about/page.tsx` - replace hardcoded grays
- [x] Fix `app/groups/page.tsx` - replace hardcoded grays
- [x] Fix `app/items/[id]/page.tsx` - replace hardcoded grays
- [x] Fix `components/items-page-content.tsx` - replace hardcoded grays

## Phase 3: Form Input Consistency
- [x] Fix `app/items/[id]/borrow/page.tsx` - input padding p-2 → p-3
- [x] Fix `app/groups/[id]/items/new/page.tsx` - input padding p-2 → p-3

## Phase 4: Documentation
- [x] Update `CLAUDE.md` - document spacing convention

---

## Summary of Changes

### Root Layout (`app/layout.tsx`)
- Changed `px-3` → `px-4 md:px-6` for better horizontal padding
- Removed redundant nested wrapper div
- Changed `gap-20` → `gap-8` for more reasonable page-level spacing

### Dark Mode Fixes (7 files)
Replaced hardcoded gray colors with CSS variable classes:
- `bg-gray-50` → `bg-surface`
- `bg-white` → `bg-base` or `bg-surface`
- `text-gray-900/800` → `text-text-primary`
- `text-gray-600/500` → `text-text-secondary`
- `text-gray-400` → `text-text-tertiary`
- `border-gray-*` → `border-border`
- Added dark mode variants for status badges

### Form Consistency (2 files)
- Changed all `p-2` inputs to `p-3`
- Added `border-border` and `bg-base` for proper dark mode support
- Fixed button styling for consistency

### Documentation
- Added spacing hierarchy to CLAUDE.md
- Documented CSS variable usage for dark mode
- Added form input conventions
