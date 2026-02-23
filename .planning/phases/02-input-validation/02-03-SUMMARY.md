---
phase: 02-input-validation
plan: 03
subsystem: api
tags: [next-safe-action, zod, server-actions, validation, client-migration]

# Dependency graph
requires:
  - phase: 02-input-validation
    plan: 01
    provides: "actionClient, authActionClient, and Zod schemas for all domains"
  - phase: 02-input-validation
    plan: 02
    provides: "Migration pattern established with auth/items/contacts domains"
provides:
  - "All 27 mutation actions across 7 domains migrated to next-safe-action with Zod validation"
  - "All client components updated to pass typed objects and handle serverError result shape"
  - "Complete input validation layer for the entire codebase"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [complete-safe-action-coverage, typed-action-calls-codebase-wide]

key-files:
  modified:
    - app/borrow/actions.ts
    - app/groups/actions.ts
    - app/notifications/actions.ts
    - components/my-inventory-section.tsx
    - components/borrow-request-card.tsx
    - components/notification-item.tsx
    - components/contact-detail-content.tsx
    - components/item-detail-modal.tsx
    - components/invite-user-modal.tsx
    - app/groups/join/[inviteCode]/page.tsx
    - app/groups/[id]/group-items-manager.tsx
    - app/groups/create-group-form.tsx
    - app/items/[id]/borrow/page.tsx

key-decisions:
  - "Query actions left as plain server functions -- only mutations use next-safe-action"
  - "markAllNotificationsAsRead and dismissAllNotifications use authActionClient with no inputSchema"
  - "joinGroupByInviteCode return value simplified from { success, groupId } to { groupId } to avoid redundant success flags"

patterns-established:
  - "All mutation actions codebase-wide now use authActionClient or actionClient from lib/safe-action.ts"
  - "All client components use result?.serverError for error handling and result?.data for success data"

requirements-completed: [VAL-03]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 2 Plan 3: Borrow/Groups/Notifications Action Migration Summary

**16 mutation actions migrated to next-safe-action with Zod validation across borrow (7), groups (5), and notifications (4) domains, completing full codebase migration of all 27 mutations**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T05:36:56Z
- **Completed:** 2026-02-23T05:42:37Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Migrated all 16 remaining mutation actions across borrow, groups, and notifications domains to next-safe-action
- Updated 8 client components to pass typed objects and handle new result shape (serverError, data)
- All 27 mutation actions across the entire codebase now use Zod validation via next-safe-action
- Shared auth middleware eliminates all per-action getUser() boilerplate in mutations

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate borrow/groups/notifications actions to next-safe-action** - `3b730ec` (feat)
2. **Task 2: Update remaining client components calling borrow/groups/notifications actions** - `6fc7a16` (feat)

## Files Created/Modified
- `app/borrow/actions.ts` - 7 mutations (borrowItem, returnItem, batchLendToContact, createBorrowRequest, acceptBorrowRequest, rejectBorrowRequest, getOrCreateContactForGroupMember) migrated to authActionClient
- `app/groups/actions.ts` - 5 mutations (createGroup, joinGroupByInviteCode, regenerateInviteCode, addItemsToGroup, addMembers) migrated to authActionClient
- `app/notifications/actions.ts` - 4 mutations (markNotificationAsRead, markAllNotificationsAsRead, dismissNotification, dismissAllNotifications) migrated to authActionClient
- `components/my-inventory-section.tsx` - Pass object to batchLendToContact, handle serverError
- `components/borrow-request-card.tsx` - Pass objects to accept/rejectBorrowRequest, handle serverError
- `components/notification-item.tsx` - Pass objects to dismiss/markAsRead/accept/reject actions
- `components/contact-detail-content.tsx` - Pass objects to returnItem/batchLend/createBorrowRequest
- `components/item-detail-modal.tsx` - Pass object to returnItem
- `components/invite-user-modal.tsx` - Pass object to addMembers, handle serverError
- `app/groups/join/[inviteCode]/page.tsx` - Pass object to joinGroupByInviteCode, handle result.data nesting
- `app/groups/[id]/group-items-manager.tsx` - Pass object to addItemsToGroup, handle serverError (auto-fix)
- `app/groups/create-group-form.tsx` - Extract form values as typed object for createGroup (auto-fix)
- `app/items/[id]/borrow/page.tsx` - Extract form values as typed object for borrowItem (auto-fix)

## Decisions Made
- Query actions intentionally left as plain server functions (not migrated) per plan -- only mutations use next-safe-action
- markAllNotificationsAsRead and dismissAllNotifications use authActionClient with no inputSchema since they require no user input
- joinGroupByInviteCode simplified return from `{ success: true, groupId }` to `{ groupId }` -- success is implied by non-error result in next-safe-action pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed group-items-manager calling addItemsToGroup with positional args**
- **Found during:** Task 1 (build verification)
- **Issue:** `app/groups/[id]/group-items-manager.tsx` was not listed in the plan but calls `addItemsToGroup(groupId, selectedItemIds)` which broke after migration
- **Fix:** Updated to `addItemsToGroup({ groupId, itemIds: selectedItemIds })` and handle serverError
- **Files modified:** `app/groups/[id]/group-items-manager.tsx`
- **Verification:** `npm run build` passes
- **Committed in:** 3b730ec (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed create-group-form calling createGroup with FormData**
- **Found during:** Task 1 (build verification)
- **Issue:** `app/groups/create-group-form.tsx` was not listed in the plan but calls `createGroup(formData)` which broke after migration
- **Fix:** Extracted form values as typed object `createGroup({ name, description })` and handle serverError
- **Files modified:** `app/groups/create-group-form.tsx`
- **Verification:** `npm run build` passes
- **Committed in:** 3b730ec (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed borrow page calling borrowItem with FormData**
- **Found during:** Task 2 (build verification)
- **Issue:** `app/items/[id]/borrow/page.tsx` was not listed in the plan but calls `borrowItem(formData)` which broke after migration
- **Fix:** Extracted form values as typed object `borrowItem({ itemId, groupId, startDate, dueDate, borrowerName })` and handle serverError
- **Files modified:** `app/items/[id]/borrow/page.tsx`
- **Verification:** `npm run build` passes
- **Committed in:** 6fc7a16 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All auto-fixes necessary to pass build. Components not listed in plan but calling migrated actions. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 (Input Validation) is now complete
- All 27 mutation actions across 7 domains use Zod validation via next-safe-action
- Shared auth middleware pattern eliminates per-action boilerplate
- Ready to proceed to Phase 3 or any subsequent phase
- No blockers

## Self-Check: PASSED

- All 13 modified files verified on disk
- Both task commits (3b730ec, 6fc7a16) verified in git log

---
*Phase: 02-input-validation*
*Completed: 2026-02-23*
