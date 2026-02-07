# Codebase Concerns

**Analysis Date:** 2026-02-07

## Tech Debt

**Deprecated Functions Not Removed:**
- Issue: `app/items/actions.ts` contains deprecated functions marked for removal (`getPotentialBorrowers()`, `searchPotentialBorrowers()`, `batchLendItems()`) on lines 310-313 but code is not deleted, only commented
- Files: `app/items/actions.ts` (lines 310-314)
- Impact: Dead code remains in codebase, confuses future developers about what functions are actually used, increases file bloat
- Fix approach: Remove the deprecated comment block entirely. Verify no code references these functions, then delete lines.

**Error Handling Inconsistency - Silent Failures in Server Actions:**
- Issue: Many server actions in `app/borrow/actions.ts`, `app/contacts/actions.ts`, `app/groups/actions.ts` log errors to console but don't provide detailed context about what failed. Example: line 206 in `app/borrow/actions.ts` logs insertError but message may be opaque (e.g., "23505 unique_violation")
- Files: `app/borrow/actions.ts` (lines 199-207), `app/groups/actions.ts` (lines 334-342), `app/contacts/actions.ts` (multiple locations)
- Impact: When mutations fail (especially RLS violations), debugging is difficult. Error messages surface to users without explanation. RLS policy violations return generic database errors instead of actionable feedback.
- Fix approach: Wrap database errors with context. Detect common error codes (23505 unique constraint, RLS violations) and return user-friendly messages. Add logging to identify policy violations early.

**No Input Validation on Forms:**
- Issue: Most server actions accept form data without schema validation. `createContact()` checks only if name is non-empty (line 81-82 in `app/contacts/actions.ts`), but email format is never validated, phone format is never validated. `createItem()` never validates inputs.
- Files: `app/items/actions.ts`, `app/contacts/actions.ts`, `app/borrow/actions.ts`, `app/groups/actions.ts`
- Impact: Invalid data can be stored in database (e.g., malformed emails, unsanitized text). No protection against XSS or SQL injection (Supabase parameterization helps, but input validation adds defense-in-depth).
- Fix approach: Add Zod schema validation to all server actions. Validate email format, phone format, required fields, string length limits. Reject invalid input before database calls.

**Excessive console.error() Calls:**
- Issue: 43 console.log/error calls found across 7 server action files. These are production noise in logs.
- Files: `app/notifications/actions.ts` (8), `app/items/actions.ts` (8), `app/users/actions.ts` (1), `app/borrow/actions.ts` (13), `app/groups/actions.ts` (4), `app/auth/actions.ts` (1), `app/contacts/actions.ts` (8)
- Impact: Server logs become cluttered, making it hard to find genuine issues. Development-time logging left in production.
- Fix approach: Replace console.error() with structured logging (e.g., Sentry, Datadog, or custom logger). For now, use conditional logging based on NODE_ENV.

## Known Bugs

**Missing Error Return in signInWithGoogle():**
- Symptoms: `app/auth/actions.ts` line 70 comments out the error return with `// return { error: error.message }`. If signInWithGoogle fails (OAuth setup issue, network error), user sees no feedback and page doesn't navigate.
- Files: `app/auth/actions.ts` (line 70)
- Trigger: Click "Sign in with Google" when OAuth provider is misconfigured or network is down
- Workaround: No workaround. User should try login via email/password instead.
- Fix approach: Uncomment line 70 to return error, or display error toast to user before attempting redirect.

**RLS Recursion Issues in Migrations:**
- Symptoms: Multiple migrations note "fix recursion" in filenames (e.g., `20251228000010_fix_items_borrower_policy_recursion.sql`). This suggests RLS policies were overly complex and caused infinite recursion or policy conflicts.
- Files: Migrations `20250129000010_fix_visibility_rls_recursion.sql`, `20251228000008_fix_borrow_requests_recursion.sql`, `20251228000009_fix_items_policy_recursion.sql`, `20251228000010_fix_items_borrower_policy_recursion.sql`
- Trigger: Certain queries might still trigger recursion if policies reference related tables circularly
- Workaround: Current migrations mitigate this, but policies are fragile
- Fix approach: Audit all RLS policies to eliminate circular references. Use explicit `.select()` to avoid joins in policy subqueries. Consider flattening permissions logic.

**Potential Orphaned Borrow Records Without Contacts:**
- Symptoms: `getActiveBorrowsGroupedByContact()` in `app/borrow/actions.ts` (lines 281-363) filters for records where `contact_id` is not null, then builds a map. Records with null contact_id are silently dropped and not displayed.
- Files: `app/borrow/actions.ts` (lines 329, 345-352)
- Trigger: If a contact is deleted after a borrow record is created (even with ON DELETE SET NULL), the record orphaned. Old data from before `contact_id` column was added may also have null values.
- Impact: Lent items are invisible in "Currently Lent" view if their contact_id is null. Users won't know they lent something.
- Fix approach: Create a migration to identify null contact_id records. Decide whether to: (1) require contact_id be non-null with FK constraint, or (2) create default "Unknown Contact" records for orphaned borrows.

**Array Coercion Assumption in Joins:**
- Symptoms: `getContactWithBorrowHistory()` in `app/contacts/actions.ts` (lines 276-279) and `getItemBorrowHistory()` in `app/items/actions.ts` (lines 264-268) assume `item` might be an array and coerce to first element. This suggests join results sometimes return arrays instead of objects.
- Files: `app/contacts/actions.ts` (lines 276-279), `app/items/actions.ts` (lines 264-268)
- Trigger: Certain Supabase client versions or query patterns might return nested arrays instead of single objects
- Impact: Data inconsistency. If item is unexpectedly an array, first element is used, others are lost. No error is surfaced.
- Fix approach: Debug why joins return arrays. Use `.single()` on Supabase queries that should return one row. Add type guards and throw errors if data shape is unexpected.

## Security Considerations

**No Rate Limiting on Server Actions:**
- Risk: Server actions (`batchLendToContact`, `createContact`, `acceptBorrowRequest`) have no rate limit. An attacker or misbehaving client could spam database with requests.
- Files: All `app/*/actions.ts` files
- Current mitigation: Supabase RLS policies enforce ownership checks, so unauthorized access is blocked. Database insert limits are default (none explicitly set).
- Recommendations: Implement rate limiting middleware in Next.js. Limit contact creation to N per minute per user. Limit batch lend operations to N per hour.

**Borrow Request Acceptance Logic Has a Gap:**
- Risk: In `acceptBorrowRequest()` (`app/borrow/actions.ts` lines 458-637), the function checks if a contact exists by `linked_user_id` first, then by email. However, it doesn't check for existing contact by exact name match. A user could have two contacts named "Alice" with different emails and the system might link the request to the wrong one if emails don't match precisely.
- Files: `app/borrow/actions.ts` (lines 528-578)
- Current mitigation: The code does check email match after linked_user_id match, so direct duplicates by email are prevented.
- Recommendations: Add a unique constraint on (owner_user_id, linked_user_id) to prevent duplicate linked contacts. Add validation to warn user if multiple contacts match the requester.

**No CSRF Protection on Forms:**
- Risk: Form actions don't appear to have CSRF tokens. If an attacker tricks a user into clicking a link from a malicious site, they could trigger a form submission (e.g., lend items, delete contacts) on the user's behalf.
- Files: All form submissions in components like `batch-lend-modal.tsx`, `add-contact-modal.tsx`
- Current mitigation: Next.js App Router with server actions provides some implicit CSRF protection via same-origin enforcement, but not explicit tokens.
- Recommendations: Verify Next.js version and CSRF protection is enabled. If needed, add explicit CSRF token middleware.

**Contact Phone Numbers Stored Unencrypted:**
- Risk: Phone numbers are stored in plaintext in `contacts` table. If database is compromised, phone numbers are exposed. PII vulnerability.
- Files: Database schema `supabase/migrations/20250129000000_create_contacts_table.sql` (line 16)
- Current mitigation: Supabase provides encryption at rest for enterprise plans, but default is unencrypted.
- Recommendations: Consider encrypting sensitive PII fields (phone, email). Or keep phone optional and encourage users to not store it. Add clear privacy notice to users.

## Performance Bottlenecks

**N+1 Query Pattern in getContactWithBorrowHistory():**
- Problem: Function fetches contact, then fetches all borrow records for that contact, then fetches items separately. If contact has 100 borrow records, and each record needs item data, this is 102 queries.
- Files: `app/contacts/actions.ts` (lines 222-329)
- Cause: Supabase join relationship handling. Items are joined in the query, but the array coercion workaround suggests issues with the join.
- Improvement path: Verify the join is working correctly with `.select('...item:items(...)...')` syntax. If join fails, switch to fetching items in batch using `.in('id', itemIds)` instead of one-by-one.

**No Pagination on Large Data Fetches:**
- Problem: `getActiveBorrowsGroupedByContact()` (lines 281-363) fetches ALL active borrow records for a user without limit. If user has lent 1000 items, all 1000 records are fetched into memory.
- Files: `app/borrow/actions.ts` (line 293)
- Cause: No `.limit()` clause on query
- Improvement path: Add `.limit(100)` with pagination. Display "Load more" button or infinite scroll on UI.

**Debounced Contact Search is 300ms, but No Minimum Query Length Enforcement at Server:**
- Problem: `searchContacts()` checks `if (!query || query.length < 2) return []` (line 41), but this runs on client side. If network is slow or user clicks search button twice, server could receive multiple queries for length 1.
- Files: `app/contacts/actions.ts` (lines 35-67), `components/batch-lend-modal.tsx` (lines 46, 53-65)
- Cause: Validation split between client (useEffect debounce) and server (string length check)
- Improvement path: Move minimum query length check to server with early return before database query. This prevents any query of length < 2 from hitting the database.

**Excessive JSON Serialization in Notifications:**
- Problem: `getNotifications()` fetches notifications with deeply nested relationships (sender, related_item, related_request with requester and item). This creates large JSON payloads.
- Files: `app/notifications/actions.ts` (lines 14-57)
- Cause: Over-fetching related data in a single query
- Improvement path: Fetch only essential notification metadata on initial load. Lazy-load related data when notification is expanded/clicked.

## Fragile Areas

**Contact Linking Logic is Complex and Error-Prone:**
- Files: `app/borrow/actions.ts` (lines 528-578 in acceptBorrowRequest)
- Why fragile: The logic tries three ways to find or create a contact: (1) by linked_user_id, (2) by email, (3) create new. Each branch has different side effects (linking existing contact if found by email). If new fields are added to contacts or linking rules change, this multi-path logic breaks easily.
- Safe modification: Extract this into a separate function `findOrCreateContactForUser()` with explicit decision tree. Add tests for all three branches (found by linked_user_id, found by email but not linked, create new).
- Test coverage: No unit tests for this logic visible. High risk of regression.

**RLS Policies are Extremely Complex:**
- Files: Multiple migrations, especially `20251228000005_create_borrow_requests.sql` (lines 43-92)
- Why fragile: Policies check existence of related records (e.g., "Users can create borrow requests for viewable items" uses subquery to check if item is public AND owned by a contact's linked user). Any schema change (rename table, add column, change FK) breaks the policy.
- Safe modification: Before modifying schema, audit all RLS policies that reference the table. Test policies thoroughly with edge cases. Consider simplifying policies if they exceed 10 lines.
- Test coverage: No visible tests for RLS policies. Changes to policies are high-risk.

**Borrow Record Status Enum Lifecycle:**
- Files: Database migrations (borrow_records has status: 'borrowed'|'returned'|'overdue'|'lost'), `app/borrow/actions.ts`
- Why fragile: Status transitions are enforced only in application logic, not in database. There's no state machine constraint. Code could transition from 'returned' to 'borrowed' if not careful.
- Safe modification: Add database constraints for valid transitions. Or maintain explicit list of valid transitions in code comments.
- Test coverage: No tests visible for status transition logic. Hard to verify all transitions are valid.

**Modal Portal Creation with document Availability Check:**
- Files: `components/batch-lend-modal.tsx` (line 131), other modal components
- Why fragile: `if (typeof document === 'undefined') return null` check is necessary but easy to forget. If a new modal is added and this check is omitted, SSR will fail silently.
- Safe modification: Create a reusable `usePortalReady()` hook that all modals use. Enforce in code review.
- Test coverage: No tests for SSR scenarios. Hard to catch missing document checks until runtime.

## Scaling Limits

**No Indexes on High-Query Fields in Some Tables:**
- Current capacity: Contacts table has indexes on owner_user_id, linked_user_id. Items table relies on default primary key index.
- Limit: Querying items by (owner_user_id, status) without index will do full table scan at ~10k items.
- Scaling path: Add index `CREATE INDEX idx_items_owner_status ON items(owner_user_id, status)`. Monitor query performance.

**Infinite Pagination in Notifications:**
- Current capacity: `getNotifications()` defaults to limit of 50. UI displays all at once.
- Limit: If user has 10k notifications, UI will try to render all 10k items, causing slowdown.
- Scaling path: Implement cursor-based pagination in `getNotifications()`. Add `.limit(50)` and track `created_at` cursor for next page.

**No Batch Operations for Multi-Item Updates:**
- Current capacity: `deleteItem()` deletes one item at a time. If user wants to delete 100 items, 100 server action calls.
- Limit: Each call has network overhead. At 100ms per request, this is 10 seconds of operations.
- Scaling path: Add `deleteItems(itemIds: string[])` batch operation. Supabase client supports `.in('id', itemIds)` for batch deletes.

## Dependencies at Risk

**Supabase SSR Package Version Lock:**
- Risk: `@supabase/ssr` is pinned at `^0.7.0` in package.json. If Supabase publishes breaking changes in 0.8.0, app breaks.
- Impact: Authentication, session management all depend on this package. Breaking changes force major refactor.
- Migration plan: Monitor Supabase releases. Test updates in dev environment before upgrading. Consider pinning to exact version `0.7.0` instead of `^0.7.0`.

**Tailwind CSS v4 Recent Release:**
- Risk: `tailwindcss` version `^4` is brand new (released late 2024). Plugin ecosystem may not fully support it yet.
- Impact: If component library or custom plugin breaks, styling may fail.
- Migration plan: Monitor Tailwind GitHub for issues. Be prepared to pin version or downgrade if needed. Test all styling in production build.

**Next.js 16 Rapid Release Cycle:**
- Risk: `next` version `^16.1.1` will auto-update to 16.2, 16.3, etc. Each minor version may have subtle changes to App Router behavior.
- Impact: Server component behavior, caching, revalidation may change unexpectedly between versions.
- Migration plan: Use exact version pinning (`16.1.1` instead of `^16.1.1`) or at least minor lock (`~16.1.1`). Test after each Next.js update.

## Missing Critical Features

**No Soft Deletes for Audit Trail:**
- Problem: When items or contacts are deleted, they're permanently removed from database. No audit log of who deleted what when. Breaks compliance if needed.
- Blocks: Cannot implement "restore deleted items" feature later without major refactor.
- Fix approach: Add `deleted_at` timestamp field to items, contacts, borrow_records. Soft-delete by setting this timestamp. Update all RLS policies to exclude deleted rows.

**No Transaction Support for Batch Operations:**
- Problem: `batchLendToContact()` creates multiple borrow_records and updates multiple items. If halfway through, 2 records created but 3rd fails, the function returns error but first 2 records remain committed. Partial state corruption.
- Blocks: Cannot safely lend multiple items with guaranteed all-or-nothing semantics.
- Fix approach: Wrap Supabase calls in transaction using `.rpc('transaction_function')` or restructure to be idempotent and retry-safe.

**No Change Data Capture (CDC) for Real-Time Sync:**
- Problem: Notifications are created by server actions, but if multiple users view the same item simultaneously, changes aren't reflected real-time.
- Blocks: Cannot implement real-time "item borrowed" alerts without polling or websockets.
- Fix approach: Use Supabase Realtime (already built-in). Subscribe to borrow_records and items channels in client components.

## Test Coverage Gaps

**No Unit Tests for Server Actions:**
- Untested area: All server actions in `app/*/actions.ts` - no test files visible
- Files: `app/items/actions.ts`, `app/borrow/actions.ts`, `app/contacts/actions.ts`, `app/groups/actions.ts`, `app/auth/actions.ts`, `app/users/actions.ts`, `app/notifications/actions.ts`
- Risk: Mutations fail silently due to RLS violations, validation gaps, or logic errors. No way to verify before deploy.
- Priority: HIGH - Server actions are core business logic

**No Integration Tests for RLS Policies:**
- Untested area: All Row-Level Security policies - whether they correctly enforce ownership, membership, visibility rules
- Files: All migrations with RLS policy definitions
- Risk: RLS policy bugs allow cross-user data leakage or access violations. High security/privacy impact.
- Priority: CRITICAL - RLS is security boundary

**No E2E Tests for Core Flows:**
- Untested area: Batch lending flow (select items → select contact → confirm → verify status updated), borrow request acceptance flow, contact creation
- Files: Would test multiple components + server actions + database
- Risk: Breaking changes to UI or API propagate undetected to production.
- Priority: HIGH - These are revenue-critical flows

**No Tests for Error Scenarios:**
- Untested area: What happens when item status is 'unavailable', contact is deleted mid-flow, network request fails, RLS denies access
- Files: All server actions
- Risk: Users see confusing errors or invalid state. No way to test error handling.
- Priority: MEDIUM - Improves user experience and reliability

---

*Concerns audit: 2026-02-07*
