# RLS Effective-State Audit

**Audit Date:** 2026-02-23
**Migration Count:** 37 (from `20240101000000_init.sql` through `20251228000010`)
**Audited By:** Phase 04 execution (automated from migration analysis)
**Status:** Effective state reconstructed from all migrations applied in order

## Summary of Findings

- **8 public tables** with RLS enabled: `users`, `groups`, `group_memberships`, `items`, `borrow_records`, `contacts`, `borrow_requests`, `notifications`
- **1 CRITICAL issue:** `users` table SELECT policy `USING (true)` exposes email/phone to all authenticated users (addressed by RLS-02)
- **7 SECURITY DEFINER functions** used to prevent RLS recursion
- **1 dropped table:** `user_follows` (removed in migration `20250129000006`)
- **Multiple redundant policies** on `items` table (6 SELECT policies, harmless due to OR logic)

---

## Per-Table Effective Policies

### Table: `public.users`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Public profiles are viewable by everyone." | PERMISSIVE | `true` | -- |
| INSERT | "Users can insert their own profile." | PERMISSIVE | -- | `auth.uid() = id` |
| UPDATE | "Users can update own profile." | PERMISSIVE | `auth.uid() = id` | `auth.uid() = id` |

**Assessment: CRITICAL**
The SELECT policy `USING (true)` allows every authenticated user to read every row including `email` and `phone` columns. This is a data privacy violation. Any authenticated user can run `SELECT email, phone FROM public.users` and see all users' personal information. RLS-02 addresses this by replacing the policy with `USING ((SELECT auth.uid()) = id)`.

---

### Table: `public.groups`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Groups are viewable by members, creators, or if public." | PERMISSIVE | `is_group_member(id, auth.uid()) OR privacy = 'public' OR created_by = auth.uid()` | -- |
| INSERT | "Users can create groups." | PERMISSIVE | -- | `auth.uid() = created_by` |

**Assessment: NOTE**
No UPDATE or DELETE policies defined. Group owners cannot currently update or delete groups via RLS-protected queries. Any group modification would need to bypass RLS or have policies added. This is a missing functionality gap but not a security issue (it restricts rather than exposes).

---

### Table: `public.group_memberships`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Memberships are viewable by group members." | PERMISSIVE | `user_id = auth.uid() OR is_group_member(group_id, auth.uid())` | -- |
| INSERT | "Users can join public groups or insert their own membership." | PERMISSIVE | -- | `auth.uid() = user_id AND (EXISTS (SELECT 1 FROM groups WHERE id = group_id AND privacy = 'public') OR EXISTS (SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()))` |
| INSERT | "Group members can add new members." | PERMISSIVE | -- | `is_group_member(group_id, auth.uid())` |

**Assessment: NOTE**
No UPDATE or DELETE policies defined. Members cannot leave groups or have their roles changed via RLS-protected queries. Same pattern as `groups` table -- restrictive rather than permissive, not a security issue.

---

### Table: `public.items`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Items are viewable by owner" | PERMISSIVE | `auth.uid() = owner_user_id` | -- |
| SELECT | "Users can view their own items." | PERMISSIVE | `auth.uid() = owner_user_id` | -- |
| SELECT | "Items are viewable by group members if public" | PERMISSIVE | `is_group_member(group_id, auth.uid()) AND privacy = 'public'` | -- |
| SELECT | "Items are viewable by lender" | PERMISSIVE | `is_lender_of_item(id, auth.uid())` | -- |
| SELECT | "Items are viewable by borrower" | PERMISSIVE | `is_borrower_of_item(id, auth.uid())` | -- |
| SELECT | "Public items are viewable from contacts" | PERMISSIVE | `privacy = 'public' AND EXISTS (SELECT 1 FROM contacts WHERE contacts.linked_user_id = items.owner_user_id AND contacts.owner_user_id = auth.uid())` | -- |
| INSERT | "Group members can create items." | PERMISSIVE | -- | `(group_id IS NULL AND auth.uid() = owner_user_id) OR is_group_member(group_id, auth.uid())` |
| INSERT | "Users can create their own items" | PERMISSIVE | -- | `auth.uid() = owner_user_id` |
| UPDATE | "Owners can update their items." | PERMISSIVE | `auth.uid() = owner_user_id` | `auth.uid() = owner_user_id` |
| DELETE | "Owners can delete their items" | PERMISSIVE | `auth.uid() = owner_user_id` | -- |

**Assessment: NOTE**
6 SELECT policies exist due to iterative migration fixes. Two are redundant ("Items are viewable by owner" and "Users can view their own items." both check `auth.uid() = owner_user_id`). PostgreSQL evaluates PERMISSIVE policies with OR logic, so redundancy is harmless but adds minor evaluation overhead. Two INSERT policies also partially overlap. No security concern -- the redundancy is cosmetic.

**Historical note:** "Items are viewable by group members." was dropped in migration `20250129000008`. "Public items are viewable by followers." was dropped in `20250129000006` when `user_follows` was removed.

---

### Table: `public.borrow_records`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Borrow records viewable by lender" | PERMISSIVE | `lender_user_id = auth.uid()` | -- |
| SELECT | "Borrow records viewable by borrower" | PERMISSIVE | `borrower_user_id = auth.uid()` | -- |
| SELECT | "Borrow records viewable by group members" | PERMISSIVE | `group_id IS NOT NULL AND is_group_member(group_id, auth.uid())` | -- |
| INSERT | "Lenders can create borrow records" | PERMISSIVE | -- | `auth.uid() = lender_user_id` |
| INSERT | "Group members can create group borrow records" | PERMISSIVE | -- | `group_id IS NOT NULL AND is_group_member(group_id, auth.uid())` |
| UPDATE | "Lenders and borrowers can update their records." | PERMISSIVE | `auth.uid() = lender_user_id OR auth.uid() = borrower_user_id` | `auth.uid() = lender_user_id OR auth.uid() = borrower_user_id` |

**Assessment: CORRECT**
Proper separation of lender, borrower, and group member access. Contact-based lending (where `borrower_user_id` is NULL and `group_id` is NULL) is correctly handled -- only the lender can see/create these records. No DELETE policy exists, which means borrow records cannot be deleted via RLS-protected queries (intentional -- records are historical).

---

### Table: `public.contacts`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Users can view their own contacts" | PERMISSIVE | `auth.uid() = owner_user_id` | -- |
| INSERT | "Users can insert their own contacts" | PERMISSIVE | -- | `auth.uid() = owner_user_id` |
| UPDATE | "Users can update their own contacts" | PERMISSIVE | `auth.uid() = owner_user_id` | `auth.uid() = owner_user_id` |
| DELETE | "Users can delete their own contacts" | PERMISSIVE | `auth.uid() = owner_user_id` | -- |

**Assessment: CORRECT**
Minimal-privilege, owner-only access on all operations. This is the ideal pattern for per-user private data.

---

### Table: `public.borrow_requests`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Users can view borrow requests for their items" | PERMISSIVE | `user_owns_borrow_request(id, auth.uid())` | -- |
| SELECT | "Users can view their own borrow requests" | PERMISSIVE | `user_is_requester(id, auth.uid())` | -- |
| INSERT | "Users can create borrow requests for viewable items" | PERMISSIVE | -- | `auth.uid() = requester_user_id` |
| UPDATE | "Owners can update borrow requests for their items" | PERMISSIVE | `user_owns_borrow_request(id, auth.uid())` | -- |
| UPDATE | "Users can cancel their own borrow requests" | PERMISSIVE | `user_is_requester(id, auth.uid())` | `status = 'cancelled'` |

**Assessment: CORRECT**
Uses SECURITY DEFINER functions to avoid recursion. The cancellation policy correctly restricts requesters to only setting status to `'cancelled'` via WITH CHECK. Item owners can update request status (approve/deny) without restriction, which is correct.

---

### Table: `public.notifications`

**RLS Enabled:** Yes

| Operation | Policy Name | Permissive | USING Expression | WITH CHECK Expression |
|-----------|------------|------------|------------------|----------------------|
| SELECT | "Users can view their own notifications" | PERMISSIVE | `auth.uid() = recipient_user_id` | -- |
| INSERT | "Authenticated users can create notifications" | PERMISSIVE | -- | `auth.uid() IS NOT NULL` |
| UPDATE | "Users can update their own notifications" | PERMISSIVE | `auth.uid() = recipient_user_id` | `auth.uid() = recipient_user_id` |
| DELETE | "Users can delete their own notifications" | PERMISSIVE | `auth.uid() = recipient_user_id` | -- |

**Assessment: NOTE**
The INSERT policy `auth.uid() IS NOT NULL` allows any authenticated user to create notifications for any recipient (the WITH CHECK only verifies the inserter is authenticated, not that they are the recipient). This is intentional by design -- server actions create notifications on behalf of the system (e.g., "User X requested to borrow your item"). The risk is low because notifications are informational only and the recipient is the only one who can read/update/delete them. Worth revisiting if user-generated notification abuse becomes a concern.

---

## SECURITY DEFINER Functions

These functions execute with the privileges of the function owner (bypassing RLS) and are used to prevent infinite recursion in RLS policies. **Do NOT modify or drop these functions** -- they fix real recursion bugs that took multiple migrations to resolve.

| Function | Created In | Purpose |
|----------|-----------|---------|
| `public.is_group_member(p_group_id UUID, p_user_id UUID)` | `20250127000001` | Check group membership without triggering RLS recursion on `group_memberships` |
| `public.is_borrowing_item(item_id UUID, user_id UUID)` | `20250128190000` | Check active borrow (superseded by `is_borrower_of_item` but may still exist) |
| `public.is_borrower_of_item(item_id UUID, user_id UUID)` | `20250129000010` | Check if user is an active borrower of a specific item |
| `public.is_lender_of_item(item_id UUID, user_id UUID)` | `20250129000010` | Check if user has ever lent a specific item |
| `public.is_public_group_item(item_id UUID)` | `20250129000010` | Check if item belongs to a public group |
| `public.user_owns_borrow_request(request_id UUID, user_id UUID)` | `20251228000008` | Check if user owns the item referenced by a borrow request |
| `public.user_is_requester(request_id UUID, user_id UUID)` | `20251228000008` | Check if user is the requester on a borrow request |

---

## Dropped Tables

### `public.user_follows`

- **Dropped in:** Migration `20250129000006`
- **Original purpose:** Asymmetric one-way user following relationships
- **Policies dropped with table:** All `user_follows` policies were automatically dropped when the table was dropped
- **Related policies dropped on other tables:**
  - `"Public items are viewable by followers."` on `public.items` was dropped in the same migration (`20250129000006`)
  - This policy allowed followers to see public items owned by users they followed

---

## Findings Summary

### CRITICAL Issues

1. **`users` table SELECT policy exposes PII** (RLS-02)
   - Policy: `"Public profiles are viewable by everyone."` with `USING (true)`
   - Impact: Any authenticated user can read `email` and `phone` for ALL users
   - Set in: `20240101000000_init.sql` (initial migration, never changed)
   - Fix: Replace with `USING ((SELECT auth.uid()) = id)` -- addressed in Plan 04-02

### NOTEs (Non-Critical Observations)

2. **`items` table has 6 SELECT policies (redundant)**
   - Two policies check `auth.uid() = owner_user_id` with identical logic
   - PostgreSQL evaluates PERMISSIVE policies with OR logic, so redundancy is harmless
   - Minor performance overhead from evaluating duplicate conditions

3. **`notifications` INSERT policy is broadly permissive**
   - `auth.uid() IS NOT NULL` allows any authenticated user to create notifications for any recipient
   - Intentional per server action design (system-generated notifications)
   - Low risk: notifications are informational only, recipient controls read/update/delete

4. **No UPDATE/DELETE policies on `groups` or `group_memberships`**
   - Group owners cannot update group details or remove members via RLS-protected queries
   - Restrictive rather than permissive -- not a security issue but limits functionality
   - May need policies added if group management features are expanded

---

## Verification SQL Query

Run this query against the live database (Supabase SQL editor) to verify the documented state matches reality.

### Query 1: List All Effective Policies

```sql
-- Verify effective RLS policy state matches this document
-- Source: PostgreSQL pg_policies system view
SELECT
  tablename,
  policyname,
  cmd AS operation,
  permissive,
  roles,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

### Query 2: Find Tables Without RLS Enabled

```sql
-- Ensure no public tables have RLS disabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT relname FROM pg_class WHERE relrowsecurity = true
  );
```

### Query 3: List SECURITY DEFINER Functions

```sql
-- Verify SECURITY DEFINER helper functions exist
SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true
ORDER BY p.proname;
```

---

**End of Audit**
*Generated: 2026-02-23*
*Source: Migration analysis of 37 migrations (20240101000000 through 20251228000010)*
