---
phase: 03-design-system-foundation
plan: 01
subsystem: ui
tags: [cva, clsx, tailwind-merge, design-system, react, tailwind-css-v4]

# Dependency graph
requires: []
provides:
  - "cn() utility function for Tailwind class merging (lib/utils.ts)"
  - "Button primitive component with 4 variants and 3 sizes (components/ui/button.tsx)"
  - "Input primitive component with size variants, error state, label support (components/ui/input.tsx)"
  - "Design token documentation reference in globals.css"
affects: [03-design-system-foundation, 05-ui-migration]

# Tech tracking
tech-stack:
  added: [class-variance-authority@0.7.1, clsx@2.1.1, tailwind-merge@3.5.0]
  patterns: [cva-variants, cn-class-merging, css-custom-property-theming]

key-files:
  created:
    - lib/utils.ts
    - components/ui/button.tsx
    - components/ui/input.tsx
  modified:
    - app/globals.css
    - package.json

key-decisions:
  - "No forwardRef on primitives -- React 19 supports ref-as-prop natively"
  - "Input size variant named inputSize to avoid HTML size attribute collision"
  - "CSS custom properties for theme-aware colors, @theme palette tokens for fixed colors"

patterns-established:
  - "CVA variant pattern: define variants with cva(), export both component and variants object"
  - "cn() merging: always pass className LAST so consumer overrides win"
  - "Theme-aware styling: use bg-[var(--bg-surface)] for surfaces, bg-primary-500 for palette"

requirements-completed: [DSN-01, DSN-07, DSN-02, DSN-03]

# Metrics
duration: 2min
completed: 2026-02-22
---

# Phase 03 Plan 01: Design System Primitives Summary

**CVA-based Button and Input primitives with cn() utility combining clsx + tailwind-merge for Tailwind v4 class merging**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-23T06:04:26Z
- **Completed:** 2026-02-23T06:06:14Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Installed class-variance-authority, clsx, and tailwind-merge (tailwind-merge v3.5.0 for Tailwind CSS v4 compatibility)
- Created cn() utility in lib/utils.ts combining clsx conditional class joining with tailwind-merge conflict resolution
- Built Button primitive with primary/secondary/destructive/ghost variants and sm/md/lg sizes using CSS custom properties
- Built Input primitive with inputSize variants, error state with visual feedback, optional label, and errorMessage support
- Added design system token reference documentation to globals.css without modifying any existing styles

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies, create cn() utility, and enhance design tokens** - `c46412e` (chore)
2. **Task 2: Build Button and Input primitive components** - `2bd19ec` (feat)

## Files Created/Modified
- `lib/utils.ts` - cn() utility combining clsx + tailwind-merge
- `components/ui/button.tsx` - Button primitive with CVA variants (primary/secondary/destructive/ghost, sm/md/lg)
- `components/ui/input.tsx` - Input primitive with CVA variants (inputSize sm/md/lg, error state, label, errorMessage)
- `app/globals.css` - Added design system token reference documentation comment block
- `package.json` - Added class-variance-authority, clsx, tailwind-merge dependencies

## Decisions Made
- No forwardRef on primitives -- React 19 supports ref-as-prop natively, per research findings
- Input size variant named `inputSize` to avoid collision with HTML `size` attribute on input elements
- CSS custom properties (var(--bg-surface), etc.) for theme-aware surface/text colors; @theme palette tokens (bg-primary-500, etc.) for fixed brand/semantic colors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- cn() utility ready for all future component development
- Button and Input primitives ready for use in Plan 02 (Card, Badge, Modal) and Phase 5 migration
- buttonVariants export available for Link-as-button styling patterns
- All existing CSS utility classes (.btn-primary, .card, .badge-*, .input-field, .modal-overlay, .modal-content) preserved for backward compatibility during migration

## Self-Check: PASSED

- [x] lib/utils.ts exists
- [x] components/ui/button.tsx exists
- [x] components/ui/input.tsx exists
- [x] Commit c46412e exists
- [x] Commit 2bd19ec exists

---
*Phase: 03-design-system-foundation*
*Completed: 2026-02-22*
