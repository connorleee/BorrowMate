---
phase: 01-critical-security-fixes
plan: 01
subsystem: auth
tags: [middleware, supabase, next.js, server-actions, authentication]

# Dependency graph
requires: []
provides:
  - Working middleware auth guard with public route allowlist
  - Auth-protected returnItem server action
affects: [02-input-validation, 04-rls-audit]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public route allowlist pattern for middleware auth"

key-files:
  created: []
  modified:
    - utils/supabase/middleware.ts
    - app/borrow/actions.ts

key-decisions:
  - "Handle root '/' as exact match separately from prefix-matched public routes to avoid re-introducing startsWith('/') bug"

patterns-established:
  - "Public route allowlist: exact match for '/', prefix match for '/auth' and '/about'"

requirements-completed: [SEC-01, SEC-02]

# Metrics
duration: 1min
completed: 2026-02-22
---

# Phase 1 Plan 1: Fix Auth Guards Summary

**Fixed middleware auth redirect (broken startsWith('/') conditional) and added missing auth check to returnItem server action**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-23T03:37:07Z
- **Completed:** 2026-02-23T03:38:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed middleware auth guard that was effectively disabled (startsWith('/') always true)
- Added explicit public route allowlist: `/` (exact), `/auth/*`, `/about/*`
- Added standard auth check to `returnItem()` -- the only mutation server action missing one

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix middleware auth guard with public route allowlist** - `c6b225f` (fix)
2. **Task 2: Add auth check to returnItem server action** - `b8b000a` (fix)

## Files Created/Modified
- `utils/supabase/middleware.ts` - Replaced broken auth conditional with public route allowlist
- `app/borrow/actions.ts` - Added getUser() and !user guard to returnItem function

## Decisions Made
- Handled root `/` as exact match separately from prefix-matched routes to avoid re-introducing the startsWith('/') bug (the plan's suggested code would have matched all paths via `'/' + '/' = '/'`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed root route matching in publicRoutes**
- **Found during:** Task 1 (middleware auth guard fix)
- **Issue:** The plan's suggested code included `/` in the publicRoutes array with prefix matching (`startsWith(route + '/')`). Since `'/' + '/' = '/'`, `startsWith('/')` is true for all paths -- this would have re-introduced the exact same vulnerability.
- **Fix:** Handle `/` as an exact match (`pathname === '/'`) separately from the prefix-matched routes array
- **Files modified:** utils/supabase/middleware.ts
- **Verification:** Build passes, manual inspection confirms only `/`, `/auth/*`, and `/about/*` are public
- **Committed in:** c6b225f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix. Without this, the plan would have shipped the same vulnerability it was trying to fix.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth guard is now functional -- unauthenticated users redirected to /auth for all protected routes
- All mutation server actions now have auth checks
- Ready for Plan 01-02 (console statement audit) to complete Phase 1

## Self-Check: PASSED

- FOUND: utils/supabase/middleware.ts
- FOUND: app/borrow/actions.ts
- FOUND: 01-01-SUMMARY.md
- FOUND: c6b225f (Task 1 commit)
- FOUND: b8b000a (Task 2 commit)

---
*Phase: 01-critical-security-fixes*
*Completed: 2026-02-22*
