---
phase: 05-ui-migration-production-polish
plan: 02
subsystem: ui
tags: [css-variables, design-system, tailwind, react, dark-mode]

# Dependency graph
requires:
  - phase: 03-design-system-foundation
    provides: "ui/ primitives (Button, Card, Badge, Input, Modal) and CSS custom properties"
  - phase: 05-01
    provides: "Toast, EmptyState, and skeleton components"
provides:
  - "19 component files migrated to CSS variable classes and design system primitives"
  - "Navigation (Sidebar, TopNav, ThemeToggle) using theme-aware colors"
  - "Card.tsx domain components wrapping ui/Card and ui/Badge internally"
  - "Dashboard and all item-related components using CSS variables and ui/ primitives"
affects: [05-03, 05-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Domain card components wrap ui/Card internally while preserving existing prop APIs"
    - "Modal migration pattern: replace createPortal+overlay with Modal from ui/"
    - "Color migration: bg-white -> bg-[var(--bg-base)], text-gray-* -> text-[var(--text-*)], remove dark: overrides"

key-files:
  created: []
  modified:
    - "components/Card.tsx"
    - "components/SidebarClientContent.tsx"
    - "components/TopNav.tsx"
    - "components/ThemeToggle.tsx"
    - "components/dashboard-content.tsx"
    - "components/my-inventory-section.tsx"
    - "components/lendable-item-card.tsx"
    - "components/batch-lend-modal.tsx"
    - "components/batch-lend-button.tsx"
    - "components/add-item-form.tsx"
    - "components/delete-item-button.tsx"
    - "components/item-detail-modal.tsx"
    - "components/item-selector-modal.tsx"
    - "app/items/[id]/page.tsx"
    - "app/items/[id]/borrow/page.tsx"

key-decisions:
  - "Card.tsx base Card component wraps ui/Card via import alias (Card as UICard) to avoid naming collision"
  - "BorrowRecordCard maps status strings to Badge variants via getStatusVariant helper function"
  - "batch-lend-modal fully migrated to use Modal shell from ui/ while keeping complex internal state logic"
  - "delete-item-button confirmation dialog migrated from manual createPortal to Modal component"
  - "Server component pages (items/[id]/page.tsx) use semantic palette tokens directly rather than importing client-side Button component"
  - "bg-foreground/text-background replaced with bg-primary-500/text-white for explicit, theme-aware primary buttons"

patterns-established:
  - "Domain components import from @/components/ui for primitives while keeping their own prop APIs"
  - "Feedback/status messages use semantic palette tokens (success-*, error-*, warning-*) with dark: variants"
  - "Form inputs in migrated components use Input from ui/ or manual CSS variable classes for textarea/select"

requirements-completed: [UIM-01, UIM-02, UIM-03]

# Metrics
duration: 7min
completed: 2026-02-24
---

# Phase 5 Plan 2: Navigation, Dashboard, and Item Components Migration Summary

**Migrated 15 files from hardcoded Tailwind gray classes to CSS custom properties and ui/ design system primitives for consistent light/dark theming**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-24T05:57:38Z
- **Completed:** 2026-02-24T06:05:00Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Card.tsx domain components (ItemCard, ContactCard, GroupCard, BorrowRecordCard) now use ui/Card and ui/Badge internally while preserving existing consumer APIs
- Navigation components (Sidebar, TopNav, ThemeToggle) fully migrated to CSS variable classes with zero hardcoded gray values
- Dashboard and all item-related components migrated to CSS variables and ui/ primitives (Button, Input, Modal, Badge)
- Zero instances of bg-white, text-gray-*, border-gray-*, or dark:*-gray-* remain in any of the 15 migrated files

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate navigation components and Card.tsx domain components** - `589b5ba` (feat)
2. **Task 2: Migrate dashboard and item-related components** - `a65c2a8` (feat)

## Files Created/Modified
- `components/Card.tsx` - Domain card components now wrap ui/Card and use ui/Badge for status badges
- `components/SidebarClientContent.tsx` - All border-gray-200 and bg-base/bg-surface references migrated to CSS variable syntax
- `components/TopNav.tsx` - bg-white, text-gray-*, hover:text-gray-* replaced with CSS variables
- `components/ThemeToggle.tsx` - Moon icon color migrated from text-gray-700 to CSS variable
- `components/dashboard-content.tsx` - Empty state text and card content use CSS variable colors, Badge for status
- `components/my-inventory-section.tsx` - Button from ui, CSS variable classes for empty state and headings
- `components/lendable-item-card.tsx` - Badge component for group/status tags, CSS variable colors
- `components/batch-lend-modal.tsx` - Full migration to Modal/Input/Button from ui, CSS variable colors
- `components/batch-lend-button.tsx` - Uses Button from ui instead of raw button element
- `components/add-item-form.tsx` - Input and Button from ui, CSS variables for textarea/select/labels
- `components/delete-item-button.tsx` - Confirmation dialog uses Modal from ui
- `components/item-detail-modal.tsx` - Uses Modal shell, Badge for status, Button for actions, Input for edit form
- `components/item-selector-modal.tsx` - Uses Modal/Button from ui, CSS variable classes for list items
- `app/items/[id]/page.tsx` - Status badges use semantic palette tokens (success-*, error-*)
- `app/items/[id]/borrow/page.tsx` - Submit button uses primary-500 instead of foreground/background

## Decisions Made
- Card.tsx imports ui/Card as UICard to avoid naming collision with its own Card export
- BorrowRecordCard uses a helper function to map status strings to Badge variant props
- Server component pages use semantic palette tokens directly (not Button component) to avoid client component imports
- bg-foreground/text-background pattern replaced with explicit bg-primary-500/text-white for clarity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Roughly half of all component files are now migrated to CSS variables and design system primitives
- Plans 03 and 04 can proceed to migrate remaining components (contacts, groups, borrow, auth, discover, about)
- Pattern is well-established: replace hardcoded gray classes with CSS variable syntax, swap raw elements for ui/ primitives

## Self-Check: PASSED

All 15 modified files exist. Both task commits (589b5ba, a65c2a8) verified. Summary file created.

---
*Phase: 05-ui-migration-production-polish*
*Completed: 2026-02-24*
