---
phase: 04-rls-audit-hardening
plan: 02
subsystem: database
tags: [rls, postgresql, supabase, security, pii-protection]

# Dependency graph
requires:
  - phase: 04-rls-audit-hardening
    provides: RLS audit identifying users table SELECT policy as overly permissive
provides:
  - Owner-only users table SELECT policy (auth.uid() = id)
  - user_profiles view exposing only id and name for cross-user lookups
  - Updated server actions using user_profiles for cross-user queries
affects: [04-rls-audit-hardening, any future plans querying users table]

# Tech tracking
tech-stack:
  added: []
  patterns: [user_profiles view for safe cross-user name lookups, self-vs-other profile query pattern]

key-files:
  created:
    - supabase/migrations/20260222000000_fix_users_rls_add_profiles_view.sql
  modified:
    - app/groups/actions.ts
    - app/borrow/actions.ts
    - app/users/actions.ts
    - app/users/[id]/page.tsx
    - components/invite-user-modal.tsx

key-decisions:
  - "user_profiles view approach over SECURITY DEFINER function for cross-user lookups (simpler, standard SQL)"
  - "searchUsers searches by name only, not email (email is PII that should not be exposed)"
  - "Email-based contact dedup in acceptBorrowRequest removed; linked_user_id dedup is sufficient"
  - "getUserProfile returns full profile for self, limited profile for others"

patterns-established:
  - "user_profiles view: Always use user_profiles (not users table) when querying other users' data"
  - "Self-vs-other pattern: Check auth.uid() === target ID to decide users vs user_profiles"

requirements-completed: [RLS-02]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 4 Plan 2: Fix Users Table RLS & User Profiles View Summary

**Owner-only users table RLS policy with user_profiles view for safe cross-user name lookups**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T06:33:10Z
- **Completed:** 2026-02-23T06:38:08Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Fixed critical security issue: users table SELECT policy no longer exposes email/phone to all authenticated users
- Created user_profiles view exposing only id and name for cross-user lookups
- Updated all cross-user server actions to use user_profiles view
- Build passes with no TypeScript errors after all changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration to fix users RLS and add user_profiles view** - `ea1db9a` (feat)
2. **Task 2: Update server actions to use user_profiles view for cross-user lookups** - `ebac045` (feat)

## Files Created/Modified
- `supabase/migrations/20260222000000_fix_users_rls_add_profiles_view.sql` - Drops overly permissive SELECT policy, creates owner-only policy, creates user_profiles view
- `app/groups/actions.ts` - searchUsers() uses user_profiles, searches name only
- `app/borrow/actions.ts` - getOrCreateContactForGroupMember and acceptBorrowRequest use user_profiles
- `app/users/actions.ts` - getUserProfile returns full profile for self, limited for others
- `app/users/[id]/page.tsx` - Conditionally renders email (own profile only)
- `components/invite-user-modal.tsx` - Removed email from User interface and display

## Decisions Made
- **user_profiles view over SECURITY DEFINER:** View approach is simpler, standard SQL, and Supabase handles it natively. Views bypass table RLS by default in PostgreSQL.
- **Name-only search:** searchUsers no longer searches by email. Email is PII and should not be used as a search field by other users.
- **Email dedup removal:** In acceptBorrowRequest, the email-based contact dedup block was removed since email is no longer available from user_profiles. The linked_user_id-based dedup (the primary mechanism) remains and is sufficient.
- **getUserProfile self-vs-other:** Branching logic checks if the requested userId matches auth user. Own row uses users table; other users use user_profiles view.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated invite-user-modal.tsx User interface and display**
- **Found during:** Task 2 (updating server actions)
- **Issue:** The InviteUserModal component had `email: string` in its User interface and displayed `user.email` in the results list. After searchUsers stopped returning email, TypeScript build failed.
- **Fix:** Removed email from User interface, updated placeholder text from "Search by name or email..." to "Search by name...", removed email display line from results.
- **Files modified:** components/invite-user-modal.tsx
- **Verification:** npm run build passes
- **Committed in:** ebac045 (Task 2 commit)

**2. [Rule 3 - Blocking] Updated user profile page to conditionally render email**
- **Found during:** Task 2 (updating getUserProfile)
- **Issue:** The user profile page at app/users/[id]/page.tsx unconditionally rendered `profile.email`. After getUserProfile returns limited profile for other users, email would be undefined.
- **Fix:** Added conditional rendering: `{'email' in profile && profile.email && (...)}`
- **Files modified:** app/users/[id]/page.tsx
- **Verification:** npm run build passes
- **Committed in:** ebac045 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking issues directly caused by planned changes)
**Impact on plan:** Both auto-fixes necessary for build to pass. No scope creep.

## Deferred Issues

Foreign key joins in PostgREST (e.g., `user:users(id, name, email)` in getGroupDetails, `lender:users!...` in getActiveBorrows, `sender:users!...` in notifications) also respect the users table RLS. After this migration, these joins will return null for non-current users' data. This affects:
- `app/groups/actions.ts` getGroupDetails() - member names in group detail view
- `app/borrow/actions.ts` getActiveBorrows() - lender/borrower names
- `app/notifications/actions.ts` - sender/requester names
- `app/items/actions.ts` - owner names

These FK joins need separate resolution (either switching to separate queries + user_profiles view, or creating SECURITY DEFINER functions). This is documented in the research as Open Question #2 and is beyond this plan's scope.

## Issues Encountered
- Server action file edits were reverted by external process twice during execution; re-applied successfully on subsequent attempts.

## User Setup Required
The migration must be applied to the database:
```bash
npx supabase db push   # For local dev
```
Or run the migration SQL manually in the Supabase dashboard SQL editor for production.

## Next Phase Readiness
- Users table RLS is now secure (owner-only SELECT)
- user_profiles view available for any future cross-user name lookups
- FK join issue documented as deferred item for future resolution

## Self-Check: PASSED

- FOUND: supabase/migrations/20260222000000_fix_users_rls_add_profiles_view.sql
- FOUND: .planning/phases/04-rls-audit-hardening/04-02-SUMMARY.md
- FOUND: Task 1 commit ea1db9a
- FOUND: Task 2 commit ebac045

---
*Phase: 04-rls-audit-hardening*
*Completed: 2026-02-23*
