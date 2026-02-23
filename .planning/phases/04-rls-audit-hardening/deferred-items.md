# Deferred Items - Phase 04: RLS Audit & Hardening

## From 04-02: Fix Users Table RLS

### FK Joins to Users Table Return Null for Non-Current Users

**Discovered during:** Plan 04-02, Task 2
**Severity:** Medium (functionality degradation, not security)
**Scope:** Out of scope for 04-02 (architectural change)

After replacing the users table SELECT policy from `USING (true)` to `USING ((SELECT auth.uid()) = id)`, PostgREST foreign key joins like `user:users(id, name, email)` will return null for users other than the authenticated user.

**Affected code:**
- `app/groups/actions.ts` getGroupDetails() - `user:users(id, name, email)` in memberships join
- `app/borrow/actions.ts` getActiveBorrows() - `lender:users!borrow_records_lender_user_id_fkey` and `borrower:users!borrow_records_borrower_user_id_fkey`
- `app/notifications/actions.ts` - `sender:users!notifications_sender_user_id_fkey` and `requester:users!borrow_requests_requester_user_id_fkey`
- `app/items/actions.ts` - `owner:users!items_owner_user_id_fkey`

**Resolution options:**
1. Replace FK joins with separate queries to `user_profiles` view + manual data assembly
2. Create SECURITY DEFINER functions for each FK relationship
3. Create a `get_user_display_name(user_id)` SECURITY DEFINER function and use it in queries

**Recommendation:** Option 1 is simplest and most maintainable. Replace each FK join with a separate `.from('user_profiles')` query, then merge results in application code.
