---
phase: 02-input-validation
plan: 02
subsystem: api
tags: [next-safe-action, zod, server-actions, validation, form-migration]

# Dependency graph
requires:
  - phase: 02-input-validation
    plan: 01
    provides: "actionClient, authActionClient, and Zod schemas for all domains"
provides:
  - "14 mutation actions (auth, items, contacts) migrated to next-safe-action"
  - "All client components updated to pass typed objects and handle serverError result shape"
affects: [02-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [safe-action-mutation-pattern, typed-action-calls, server-error-handling]

key-files:
  modified:
    - app/auth/actions.ts
    - app/items/actions.ts
    - app/contacts/actions.ts
    - app/auth/page.tsx
    - components/add-item-form.tsx
    - components/add-contact-modal.tsx
    - components/contact-card.tsx
    - components/contact-list-section.tsx
    - components/batch-lend-modal.tsx
    - components/delete-item-button.tsx
    - components/item-detail-modal.tsx
    - components/TopNav.tsx
    - components/SidebarClientContent.tsx
    - app/groups/[id]/items/new/page.tsx

key-decisions:
  - "logout action uses authActionClient with no inputSchema -- requires wrapper function for form action usage in server components"
  - "signInWithGoogle uses actionClient (not authActionClient) with empty schema since user is not yet authenticated"
  - "Query actions left unchanged -- only mutations migrated to next-safe-action"

patterns-established:
  - "Mutation migration pattern: replace FormData params with parsedInput destructuring, return { error } with throw new Error(), keep revalidatePath and redirect"
  - "Client result handling: check result?.serverError instead of result?.error, check result?.data instead of result.success"
  - "Form action wrapper: for safe actions with no input used in form action, wrap in async function"

requirements-completed: [VAL-03]

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 2 Plan 2: Auth/Items/Contacts Action Migration Summary

**14 mutation actions migrated to next-safe-action with Zod validation, and 11 client components updated to pass typed objects with serverError handling**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T05:28:42Z
- **Completed:** 2026-02-23T05:34:19Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Migrated all 14 mutation actions across auth (4), items (3), and contacts (4) domains to next-safe-action
- Updated 11 client components to pass typed objects instead of FormData and handle new result shape (serverError, data, validationErrors)
- All query actions left unchanged -- only mutations needed migration
- Build and TypeScript compilation pass cleanly

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate auth, items, contacts mutations to next-safe-action** - `a3f1162` (feat)
2. **Task 2: Update client components calling auth/items/contacts actions** - `9fa57a1` (feat)

## Files Created/Modified
- `app/auth/actions.ts` - login, signup, logout, signInWithGoogle migrated to actionClient/authActionClient
- `app/items/actions.ts` - createItem, deleteItem, updateItem migrated to authActionClient
- `app/contacts/actions.ts` - createContact, updateContact, deleteContact, linkContactToUser migrated to authActionClient
- `app/auth/page.tsx` - Extract form values as typed objects, handle serverError, signInWithGoogle via button onClick
- `components/add-item-form.tsx` - Pass typed object to createItem, handle serverError
- `components/add-contact-modal.tsx` - Pass typed object to createContact, handle serverError
- `components/contact-card.tsx` - Pass { contactId } to deleteContact
- `components/contact-list-section.tsx` - Pass { contactId } to deleteContact
- `components/batch-lend-modal.tsx` - Pass typed object to createContact, handle result.data.data nesting
- `components/delete-item-button.tsx` - Pass { itemId } to deleteItem, handle serverError
- `components/item-detail-modal.tsx` - Pass { itemId } to deleteItem, { itemId, ... } to updateItem, handle serverError
- `components/TopNav.tsx` - Wrap logout in handleLogout server action for form action compatibility
- `components/SidebarClientContent.tsx` - Wrap logout call in async arrow function for form action
- `app/groups/[id]/items/new/page.tsx` - Extract form values as typed objects for createItem (auto-fix)

## Decisions Made
- logout uses authActionClient with no inputSchema. Since form actions pass FormData, a thin wrapper function is needed for server/client components that use `<form action={logout}>`.
- signInWithGoogle changed from form action to button onClick handler since it uses actionClient with empty schema.
- Query actions intentionally left as plain server action functions (not migrated) per plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed groups add-item page calling createItem with FormData**
- **Found during:** Task 2 (Update client components)
- **Issue:** `app/groups/[id]/items/new/page.tsx` was not listed in the plan but calls `createItem(formData)` which broke after migration
- **Fix:** Extracted form values as typed object, updated to `createItem({ name, description, category, privacy, groupId })` and handle serverError
- **Files modified:** `app/groups/[id]/items/new/page.tsx`
- **Verification:** `npm run build` passes
- **Committed in:** 9fa57a1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix necessary to pass build. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth, items, and contacts domains fully migrated to next-safe-action
- Plan 03 ready to migrate remaining domains: borrow, groups, notifications, users
- No blockers

## Self-Check: PASSED

- All 14 modified files verified on disk
- Both task commits (a3f1162, 9fa57a1) verified in git log

---
*Phase: 02-input-validation*
*Completed: 2026-02-23*
