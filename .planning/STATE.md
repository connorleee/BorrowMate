# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Users can quickly lend items to contacts and always know who has what
**Current focus:** Phase 4 - RLS Audit & Hardening

## Current Position

Phase: 4 of 5 (RLS Audit & Hardening) -- COMPLETE
Plan: 2 of 2 in current phase (all plans complete)
Status: Phase 4 Complete
Last activity: 2026-02-23 -- Completed 04-02-PLAN.md

Progress: [█████████░] 90%

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 4min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-critical-security-fixes | 2 | 7min | 3.5min |
| 02-input-validation | 3 | 13min | 4.3min |
| 03-design-system-foundation | 2 | 4min | 2min |
| 04-rls-audit-hardening | 2 | 8min | 4min |

**Recent Trend:**
- Last 5 plans: 03-01 (2min), 03-02 (2min), 04-01 (3min), 04-02 (5min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Security track (Phases 1, 2, 4) and UI track (Phases 3, 5) are independent -- can interleave Phases 2 and 3
- Roadmap: Critical middleware auth bug must be fixed before any other work
- 01-01: Handle root '/' as exact match separately from prefix-matched public routes to avoid re-introducing startsWith('/') bug
- 01-02: Simple removal of console statements (no logging framework) -- errors already propagated via return values
- 02-01: Zod v4 installed (latest) instead of v3 -- fully compatible with next-safe-action v8 via Standard Schema
- 02-01: No console.error in handleServerError -- per Phase 1 decision, errors propagated via return values only
- 02-02: logout uses authActionClient with no inputSchema -- requires wrapper for form action usage
- 02-02: Query actions intentionally left as plain server actions, not migrated
- 02-03: Query actions left as plain server functions -- only mutations use next-safe-action
- 02-03: markAllNotificationsAsRead/dismissAllNotifications use authActionClient with no inputSchema
- 02-03: joinGroupByInviteCode return simplified from { success, groupId } to { groupId }
- 03-01: No forwardRef on primitives -- React 19 supports ref-as-prop natively
- 03-01: Input size variant named inputSize to avoid HTML size attribute collision
- 03-01: CSS custom properties for theme-aware colors, @theme palette tokens for fixed colors
- 03-02: Modal uses composable sub-components (ModalHeader/ModalBody/ModalFooter) rather than prop-based sections
- 03-02: Added type exports to button.tsx and input.tsx to enable barrel re-exports
- 03-02: Badge palette shifts use dark: prefix; neutral/surface variants use CSS custom properties
- 04-01: Static CSP with unsafe-inline instead of nonce-based CSP (avoids forcing dynamic rendering on all pages)
- 04-01: Conditional unsafe-eval only in development mode for Next.js HMR support
- 04-01: frame-ancestors 'none' in CSP plus X-Frame-Options DENY for legacy browser fallback
- 04-02: user_profiles view over SECURITY DEFINER function for cross-user lookups (simpler, standard SQL)
- 04-02: searchUsers searches by name only, not email (email is PII)
- 04-02: Email-based contact dedup removed in acceptBorrowRequest; linked_user_id dedup is sufficient
- 04-02: getUserProfile returns full profile for self, limited (id + name) for others

### Pending Todos

None yet.

### Blockers/Concerns

- ~~Middleware auth guard is effectively disabled (pathname.startsWith('/') is always true) -- Phase 1 blocker for production~~ RESOLVED in 01-01
- ~~RLS effective policy state unknown until audit in Phase 4~~ RESOLVED in 04-01 (RLS-AUDIT.md created)

## Session Continuity

Last session: 2026-02-23
Stopped at: Completed 04-02-PLAN.md (Phase 4 complete)
Resume file: None
