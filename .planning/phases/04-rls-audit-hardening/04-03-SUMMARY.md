---
phase: 04-rls-audit-hardening
plan: 03
subsystem: database
tags: [rls, postgresql, supabase, security, user-profiles, fk-joins]

# Dependency graph
requires:
  - phase: 04-rls-audit-hardening (plan 02)
    provides: user_profiles view and owner-only SELECT RLS on users table
provides:
  - All server action read queries use user_profiles view for cross-user name lookups
  - No FK joins on users table remain in any query function
  - No user email addresses leak through cross-user queries
affects: [05-ux-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [batch user_profiles fetch with manual data assembly, separate query + map pattern for RLS-safe cross-user lookups]

key-files:
  created: []
  modified:
    - app/groups/actions.ts
    - app/borrow/actions.ts
    - app/notifications/actions.ts
    - app/items/actions.ts
    - app/groups/[id]/page.tsx

key-decisions:
  - "Preserve property names (owner, lender, borrower, sender, requester, users) for backward compatibility with UI components"
  - "Remove email display from group member list (PII protection per RLS-02)"

patterns-established:
  - "user_profiles batch fetch: collect IDs -> .from('user_profiles').in('id', ids) -> Object.fromEntries map -> attach to results"

requirements-completed: [RLS-02]

# Metrics
duration: 3min
completed: 2026-02-23
---

# Phase 4 Plan 3: FK Join Gap Closure Summary

**Replaced all 9 PostgREST FK joins on the users table with user_profiles view batch queries across 4 server action files, closing the RLS regression gap**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-23T06:56:19Z
- **Completed:** 2026-02-23T06:59:33Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Replaced all FK joins on users table (users!, :users(), created_by(), owner_user_id()) with separate user_profiles view queries in 9 query functions across 4 server action files
- Implemented consistent batch-fetch pattern: collect user IDs, single .from('user_profiles') query, map results back to original data
- Removed member email display from group detail page to prevent PII leakage
- All return value shapes preserved for backward compatibility with UI components

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace FK joins on users table with user_profiles queries in all server actions** - `484012e` (feat)
2. **Task 2: Remove email references from UI components consuming updated server actions** - `3225085` (fix)

## Files Created/Modified
- `app/groups/actions.ts` - getGroupDetails and getGroupByInviteCode now use user_profiles for owner/member name lookups
- `app/borrow/actions.ts` - getActiveBorrows now uses user_profiles for lender/borrower name lookups
- `app/notifications/actions.ts` - getNotifications and getPendingBorrowRequests now use user_profiles for sender/requester name lookups
- `app/items/actions.ts` - getGroupItems, getItemDetails, getBorrowedItems, getItemDetailsWithBorrow now use user_profiles for owner name lookups
- `app/groups/[id]/page.tsx` - Removed member email display line from group members list

## Decisions Made
- Preserved existing property names (owner, lender, borrower, sender, requester, users) on return objects so all downstream UI components continue working without changes
- Removed member email display from group detail page -- displaying other users' email violates the RLS-02 privacy goal

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 4 (RLS Audit & Hardening) is now fully complete with all 3 plans executed
- All cross-user queries use the user_profiles view, ensuring RLS policies on the users table are respected
- Ready for Phase 5 (UX Polish)

## Self-Check: PASSED

- All 5 modified files verified on disk
- Commit `484012e` (Task 1) verified in git log
- Commit `3225085` (Task 2) verified in git log
- `npm run build` passes with zero errors
- No FK joins on users table remain in any server action file
- All 4 server action files contain user_profiles queries

---
*Phase: 04-rls-audit-hardening*
*Completed: 2026-02-23*
