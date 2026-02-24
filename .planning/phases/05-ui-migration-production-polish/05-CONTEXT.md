# Phase 5: UI Migration & Production Polish - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate all existing components to the Phase 3 design system primitives, eliminate all hardcoded color values, fix dark mode consistency across every page, and add user feedback systems (toast notifications, empty states, loading indicators). No new features or capabilities — this is migration and polish of what exists.

</domain>

<decisions>
## Implementation Decisions

### Toast notifications
- Position: bottom center of the screen
- Auto-dismiss after 3 seconds for success toasts
- Error toasts stay longer (6 seconds) and include a dismiss button so users can read the message
- Stack up to 3 toasts at once, oldest dismissed first
- Visual style: success (green), error (red) — consistent with existing badge color conventions

### Empty states
- Visual approach: text + CTA button only — no illustrations or icons
- Tone: friendly and encouraging (e.g., "No items yet — add your first one!")
- Every empty list gets a CTA button, even borrow records (CTA can be "Lend something" to guide to lending flow)
- Use the frontend-design skill during implementation for high design quality

### Loading indicators
- Page-level loading: skeleton screens that match page layout (shimmer placeholders)
- Form submissions and button actions: Claude's discretion on approach
- Search input loading: Claude's discretion on approach
- Navigation transitions: Claude's discretion on approach

### Dark mode
- Replace all hardcoded bg-white, text-gray-X, border-gray-X with CSS variable classes
- Adjust dark mode token values in globals.css if contrast or readability is poor
- Audit all borders and dividers — replace with border-border variable
- Adjust shadows for dark mode — lighter/more subtle shadows or border-based elevation
- Default color mode: Claude's discretion (system preference vs explicit default)

### Claude's Discretion
- Form submission loading indicator style (button spinner, overlay, etc.)
- Search loading indicator approach
- Navigation transition indicator (progress bar vs none)
- Whether filtered/search empty states differ from truly-empty states
- Default color mode preference
- Skeleton screen specific layouts per page

</decisions>

<specifics>
## Specific Ideas

- User wants to use the frontend-design skill during implementation for distinctive, production-grade UI
- Toast position bottom-center chosen for mobile-friendliness
- Error toasts explicitly get more time (6s) + manual dismiss — user wants errors to be readable
- Empty states are deliberately minimal (text + CTA) — no illustrations, keep it clean
- Dark mode pass should be thorough: colors, borders, AND shadows all audited

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-ui-migration-production-polish*
*Context gathered: 2026-02-23*
