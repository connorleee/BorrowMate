---
phase: 04-rls-audit-hardening
verified: 2026-02-22T18:00:00Z
status: passed
score: 3/3 success criteria verified
re_verification: true
  previous_status: gaps_found
  previous_score: 2/3
  gaps_closed:
    - "An authenticated user querying the users table cannot see other users' email addresses or phone numbers — FK joins in getGroupDetails(), getActiveBorrows(), and notifications/actions.ts replaced with separate user_profiles view queries; group detail page no longer displays member email"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Apply migration 20260222000000 to a local database and load the group detail page"
    expected: "Group member names are visible (not null/blank) — code now uses user_profiles view which only exposes id and name"
    why_human: "Cannot verify PostgREST view behavior against a live database without running the app"
  - test: "Apply migration and load /dashboard borrowed/lent sections"
    expected: "Lender and borrower names are visible for active borrow records"
    why_human: "Same live-database runtime dependency"
  - test: "Apply migration and open the notifications panel"
    expected: "Notification sender names are visible"
    why_human: "Same live-database runtime dependency"
---

# Phase 4: RLS Audit & Hardening Verification Report

**Phase Goal:** Every database table has documented, minimal-privilege RLS policies and the app sends proper security headers
**Verified:** 2026-02-22T18:00:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (04-03-PLAN.md / 04-03-SUMMARY.md)

## Previous Verification Summary

Initial verification (2026-02-23T07:00:00Z) found status `gaps_found` (2/3 truths verified). The gap was:

- FK joins in `getGroupDetails()`, `getActiveBorrows()`, `getNotifications()`, `getPendingBorrowRequests()`, and item action functions still referenced the `users` table via PostgREST embedded syntax (`user:users(id, name, email)`), which would return null for non-current-user rows once the RLS migration was applied, causing a functionality regression in group member name display, active borrow counterparty names, and notification sender names.

Plan 04-03 was created and executed to close this gap.

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A single audit document describes the effective RLS policy state for every table (consolidated from 37 migrations) | VERIFIED | `.planning/phases/04-rls-audit-hardening/RLS-AUDIT.md` exists, 265 lines, 8 `### Table:` sections covering all public tables, SECURITY DEFINER catalog, findings summary, pg_policies SQL queries |
| 2 | An authenticated user querying the users table cannot see other users' email addresses or phone numbers | VERIFIED | Migration `20260222000000_fix_users_rls_add_profiles_view.sql` tightens SELECT to `USING ((SELECT auth.uid()) = id)`. All 9 cross-user query functions across 4 server action files now use `.from('user_profiles')` batch fetch pattern — zero FK joins on users table remain. Group detail page no longer displays member email. Build passes with zero errors. |
| 3 | Response headers include Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy on every page load | VERIFIED | `next.config.ts` contains all 4 required headers applied to `source: "/(.*)"`. Build passes. |

**Score:** 3/3 truths verified

---

## Required Artifacts

### Plan 04-01 Artifacts

| Artifact | Exists | Substantive | Wired | Status | Details |
|----------|--------|-------------|-------|--------|---------|
| `.planning/phases/04-rls-audit-hardening/RLS-AUDIT.md` | Yes | Yes — 8 table sections, SECURITY DEFINER catalog, findings, SQL queries | N/A (doc) | VERIFIED | 265 lines; all 8 public tables covered |
| `next.config.ts` | Yes | Yes — async `headers()` with 4 required headers + CSP | Wired — applied to `/(.*)`; build passes | VERIFIED | All 4 headers confirmed present on grep |

### Plan 04-02 Artifacts

| Artifact | Exists | Substantive | Wired | Status | Details |
|----------|--------|-------------|-------|--------|---------|
| `supabase/migrations/20260222000000_fix_users_rls_add_profiles_view.sql` | Yes | Yes — DROP POLICY + CREATE POLICY + CREATE VIEW + GRANT | N/A (migration) | VERIFIED (static) | Correct SQL present; file exists at expected path |
| `app/users/actions.ts` | Yes | Yes — self-vs-other branching pattern | Wired | VERIFIED | Own profile: `.from('users').eq('id', userId)`. Other users: `.from('user_profiles')` |
| `app/borrow/actions.ts` | Yes | Yes — `getActiveBorrows()` fully updated | Wired | VERIFIED | Lines 140-163: batch user_profiles fetch pattern; no FK joins on users table remain; email not included in returned objects |
| `app/groups/actions.ts` | Yes | Yes — `getGroupDetails()` and `getGroupByInviteCode()` fully updated | Wired | VERIFIED | Lines 100-135: batch user_profiles fetch for owner + all members. Lines 164-175: single user_profiles fetch for owner. No FK joins remain. |

### Plan 04-03 Artifacts (Gap Closure)

| Artifact | Exists | Substantive | Wired | Status | Details |
|----------|--------|-------------|-------|--------|---------|
| `app/notifications/actions.ts` | Yes | Yes — `getNotifications()` and `getPendingBorrowRequests()` updated | Wired | VERIFIED | Lines 60-96: batch user_profiles fetch for sender_user_id and related_request.requester_user_id. Lines 193-212: batch fetch for requester. No FK joins on users table. |
| `app/items/actions.ts` | Yes | Yes — `getGroupItems()`, `getItemDetails()`, `getBorrowedItems()`, `getItemDetailsWithBorrow()` all updated | Wired | VERIFIED | 4 separate user_profiles query patterns confirmed at lines 28-44, 90-103, 160-178, 218-228. No FK joins on users table. |
| `app/groups/[id]/page.tsx` | Yes | Yes — member email display line removed | N/A (presentation) | VERIFIED | No `email` references found in file. Member name displayed via `membership.user?.name`. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `next.config.ts` | `NEXT_PUBLIC_SUPABASE_URL` | `process.env` in connect-src | WIRED | `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""` used in CSP header |
| `app/groups/actions.ts` | `public.user_profiles` | `.from('user_profiles').select('id, name').in('id', userIds)` | WIRED | Confirmed at lines 112-114 (getGroupDetails batch) and lines 168-170 (getGroupByInviteCode single fetch) |
| `app/borrow/actions.ts` | `public.user_profiles` | `.from('user_profiles').select('id, name').in('id', userIds)` | WIRED | Confirmed at lines 143-146 (getActiveBorrows batch) and line 494 (acceptBorrowRequest single fetch) |
| `app/notifications/actions.ts` | `public.user_profiles` | `.from('user_profiles').select('id, name').in('id', userIds)` | WIRED | Confirmed at lines 73-76 (getNotifications batch) and lines 199-202 (getPendingBorrowRequests batch) |
| `app/items/actions.ts` | `public.user_profiles` | `.from('user_profiles').select(...)` | WIRED | Confirmed at lines 32-34, 94-96, 164-166, 222-224 |
| `supabase/migrations/20260222000000...` | `public.users` | DROP POLICY + CREATE POLICY USING `auth.uid() = id` | WIRED (static) | Migration file exists and contains correct SQL |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| RLS-01 | 04-01-PLAN.md | All RLS policies audited and documented in single effective-state document | SATISFIED | `RLS-AUDIT.md` exists with 8 table sections, SECURITY DEFINER catalog, findings summary, SQL audit queries. Marked `[x]` in REQUIREMENTS.md. |
| RLS-02 | 04-02-PLAN.md, 04-03-PLAN.md | Users table SELECT policy tightened; no email/phone exposed to other users | SATISFIED | Migration tightens policy to owner-only. All 9 query functions (across 4 files) use `user_profiles` view for cross-user lookups. Zero FK joins on `users` table remain. No `email` fields returned from cross-user queries. Marked `[x]` in REQUIREMENTS.md. |
| RLS-03 | 04-01-PLAN.md | Security headers on every page load | SATISFIED | All 4 headers confirmed in `next.config.ts` applied to `source: "/(.*)"`. Build passes. Marked `[x]` in REQUIREMENTS.md. |

### Requirements Orphan Check

REQUIREMENTS.md maps RLS-01, RLS-02, RLS-03 to Phase 4 (lines 91-93). All three are claimed by plans 04-01, 04-02, 04-03. No orphaned requirements.

---

## Anti-Patterns Found

| File | Location | Pattern | Severity | Impact |
|------|----------|---------|----------|--------|
| `app/borrow/actions.ts` | Line 335 | `contacts` table query includes `email` | Info | Not a concern — this queries the `contacts` table (user's own private data, RLS enforces `owner_user_id = auth.uid()`). Expected and correct. |

No blockers or warnings found. The single info-level item is not a gap.

---

## Re-Verification: Gaps Closed

### Gap That Was Open: FK Joins on users Table

**Previous status:** PARTIAL — FK joins in `getGroupDetails()`, `getActiveBorrows()`, and `notifications/actions.ts` still used `user:users(id, name, email)` PostgREST syntax which would return null for other-user rows after RLS migration.

**Current status:** CLOSED

Evidence of closure:
- `grep -n "users!" app/groups/actions.ts app/borrow/actions.ts app/notifications/actions.ts app/items/actions.ts` — zero matches
- `grep -n ":users(" app/groups/actions.ts app/borrow/actions.ts app/notifications/actions.ts app/items/actions.ts` — zero matches
- `grep -n "created_by(" app/groups/actions.ts` — zero matches
- `user_profiles` confirmed present in all 4 files (25+ matching lines)
- `app/groups/[id]/page.tsx` — no `email` references; member email display line removed
- `npm run build` — passes with zero TypeScript errors

### Previously Passing Items: Regression Check

| Item | Status |
|------|--------|
| RLS-AUDIT.md exists with 8 table sections | VERIFIED (not modified by 04-03) |
| Security headers in next.config.ts | VERIFIED (confirmed on re-check: all 4 headers present) |
| Migration `20260222000000` file exists | VERIFIED (file confirmed at expected path) |
| Build passes | VERIFIED (`npm run build` passes, all routes generated) |

---

## Human Verification Required

The automated checks confirm the code is correct. Runtime confirmation still needs a live database:

### 1. Group Member Names After Migration

**Test:** Apply migration `20260222000000_fix_users_rls_add_profiles_view.sql` to local DB, log in, navigate to any group detail page (`/groups/[id]`) where other users are members.
**Expected:** Group member names display correctly — code now fetches from `user_profiles` view via `.in('id', userIds)` batch query, not FK join on `users`.
**Why human:** View behavior requires a live Supabase instance to confirm the grant to `authenticated` role is effective.

### 2. Active Borrows After Migration

**Test:** Apply migration, navigate to `/dashboard` or `/borrow` and view active borrowed/lent items.
**Expected:** Lender and borrower names display correctly.
**Why human:** Same live-database runtime dependency.

### 3. Notifications Panel After Migration

**Test:** Apply migration, trigger a borrow request notification, open the notifications panel.
**Expected:** Notification sender name and requester name display correctly.
**Why human:** Same live-database runtime dependency.

---

## Summary

Phase 4 goal is fully achieved. All three observable truths are verified:

1. **RLS-AUDIT.md** documents the effective RLS policy state for all 8 public tables — consolidated from all migrations.
2. **Users table RLS tightened** — migration restricts SELECT to owner-only; all 9 cross-user query functions across 4 server action files use the `user_profiles` view (id + name only); group member email display removed from UI; zero FK joins on `users` table remain.
3. **Security headers** — Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy applied to all routes via `next.config.ts`; build passes.

The gap identified in initial verification (PostgREST FK joins bypassing explicit table selection) was closed by plan 04-03. Human verification is retained for the three items that require a live database to confirm runtime behavior.

---

_Verified: 2026-02-22T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes (initial: 2026-02-23T07:00:00Z, status: gaps_found → now: passed)_
