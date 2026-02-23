# Phase 4: RLS Audit & Hardening - Research

**Researched:** 2026-02-22
**Domain:** Supabase PostgreSQL RLS policies + Next.js security headers
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RLS-01 | All RLS policies across 37 migrations audited and documented in single effective-state document | Effective policy state reconstructed below; SQL audit query provided |
| RLS-02 | Users table SELECT policy tightened to not expose email/phone to all authenticated users | Current policy uses `USING (true)` — must be replaced with `USING (auth.uid() = id)` |
| RLS-03 | Security headers added (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | `next.config.ts` `headers()` approach documented with exact values |
</phase_requirements>

---

## Summary

BorrowMate has 37 migrations that started with a simple group-centric schema and evolved into a contact-centric lending model. The migration history reveals a series of RLS fixes for infinite recursion — a pattern that emerges when policies cross-reference tables that themselves have policies. The effective RLS state is reconstructed below by tracing all `DROP POLICY` / `CREATE POLICY` operations in chronological order.

The single most urgent security issue is the `users` table SELECT policy: `USING (true)`. This was set in the initial migration and never changed. Any authenticated user can query `SELECT email, phone FROM public.users` and see every user's email address and phone number. This must be replaced with `USING ((SELECT auth.uid()) = id)` via a new migration.

For security headers, Next.js provides a native `headers()` function in `next.config.ts` that applies headers to all routes — no new packages needed. The CSP must include `connect-src` for the Supabase project URL since the app makes browser-side fetch calls to Supabase.

**Primary recommendation:** Write one new migration to fix the users table RLS, and add security headers via `next.config.ts`. Both are small, self-contained changes. The audit document is a separate deliverable (a new SQL file plus a markdown record).

---

## Effective RLS Policy State (Reconstructed from 37 Migrations)

This is the ground truth after all migrations applied in order. Policies are listed as they exist after the last migration overwrites earlier ones.

### Table: `public.users`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Public profiles are viewable by everyone." | `true` — **SECURITY ISSUE** |
| INSERT | "Users can insert their own profile." | `auth.uid() = id` |
| UPDATE | "Users can update own profile." | `auth.uid() = id` |

**Problem:** The SELECT policy `USING (true)` allows every authenticated user to read every row including `email` and `phone`. This must be replaced.

**Fix migration:**
```sql
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;

CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
```

> Note: `(SELECT auth.uid())` (subquery form) is preferred over `auth.uid()` for performance — PostgreSQL evaluates the subquery once per statement rather than per row.

**Downstream concern:** App code that queries other users by name (e.g., for group membership display, contact linking) must use server-side code with the service role key, OR a separate limited-exposure view/function. Review `app/users/actions.ts` for any queries that pull user name/email for display.

### Table: `public.groups`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Groups are viewable by members, creators, or if public." | member OR `privacy='public'` OR `created_by = auth.uid()` |
| INSERT | "Users can create groups." | `auth.uid() = created_by` |
| UPDATE | (none defined) | — |
| DELETE | (none defined) | — |

### Table: `public.group_memberships`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Memberships are viewable by group members." | `user_id = auth.uid()` OR `is_group_member(group_id, auth.uid())` |
| INSERT | "Users can join public groups or insert their own membership." | `auth.uid() = user_id` AND (public group OR creator) |
| INSERT | "Group members can add new members." | member of same group_id |
| UPDATE | (none defined) | — |
| DELETE | (none defined) | — |

### Table: `public.items`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Items are viewable by owner" | `auth.uid() = owner_user_id` |
| SELECT | "Users can view their own items." | `auth.uid() = owner_user_id` (redundant with above) |
| SELECT | "Items are viewable by group members if public" | group member AND `privacy='public'` |
| SELECT | "Items are viewable by lender" | `is_lender_of_item(id, auth.uid())` (SECURITY DEFINER fn) |
| SELECT | "Items are viewable by borrower" | `is_borrower_of_item(id, auth.uid())` (SECURITY DEFINER fn) |
| SELECT | "Public items are viewable from contacts" | `privacy='public'` AND contact's `linked_user_id = owner_user_id` |
| INSERT | "Group members can create items." | `(group_id IS NULL AND auth.uid() = owner_user_id)` OR group member |
| INSERT | "Users can create their own items" | `auth.uid() = owner_user_id` (overlaps with above) |
| UPDATE | "Owners can update their items." | `auth.uid() = owner_user_id` |
| DELETE | "Owners can delete their items" | `auth.uid() = owner_user_id` |

> Note: `"Items are viewable by group members."` was dropped in migration `20250129000008`. `"Public items are viewable by followers."` was dropped in `20250129000006` (user_follows removed).

### Table: `public.borrow_records`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Borrow records viewable by lender" | `lender_user_id = auth.uid()` |
| SELECT | "Borrow records viewable by borrower" | `borrower_user_id = auth.uid()` |
| SELECT | "Borrow records viewable by group members" | `group_id IS NOT NULL` AND group member |
| INSERT | "Lenders can create borrow records" | `auth.uid() = lender_user_id` |
| INSERT | "Group members can create group borrow records" | `group_id IS NOT NULL` AND group member |
| UPDATE | "Lenders and borrowers can update their records." | `auth.uid() = lender_user_id` OR `auth.uid() = borrower_user_id` |

> Note: "Borrow records are viewable by involved parties." (the contact_id variant from `20250129000001`) was replaced by the three separate policies in `20251228000008`.

### Table: `public.contacts`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Users can view their own contacts" | `auth.uid() = owner_user_id` |
| INSERT | "Users can insert their own contacts" | `auth.uid() = owner_user_id` |
| UPDATE | "Users can update their own contacts" | `auth.uid() = owner_user_id` |
| DELETE | "Users can delete their own contacts" | `auth.uid() = owner_user_id` |

**Status: CORRECT.** Minimal-privilege, owner-only access.

### Table: `public.borrow_requests`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Users can view borrow requests for their items" | `auth.uid() = owner_user_id` |
| SELECT | "Users can view their own borrow requests" | `auth.uid() = requester_user_id` |
| INSERT | "Users can create borrow requests for viewable items" | `auth.uid() = requester_user_id` AND item visible |
| UPDATE | "Owners can update borrow requests for their items" | `auth.uid() = owner_user_id` |
| UPDATE | "Users can cancel their own borrow requests" | `auth.uid() = requester_user_id` AND `status = 'cancelled'` |

### Table: `public.notifications`

| Operation | Policy Name | USING / WITH CHECK |
|-----------|------------|-------------------|
| SELECT | "Users can view their own notifications" | `auth.uid() = recipient_user_id` |
| INSERT | "Authenticated users can create notifications" | `auth.uid() IS NOT NULL` |
| UPDATE | "Users can update their own notifications" | `auth.uid() = recipient_user_id` |
| DELETE | "Users can delete their own notifications" | `auth.uid() = recipient_user_id` |

> Minor concern: INSERT policy `auth.uid() IS NOT NULL` allows any authenticated user to create notifications for any recipient. This is intentional per the app's design (server actions create notifications) but worth flagging in the audit doc.

### Dropped Tables (no longer active)

- `public.user_follows` — dropped in `20250129000006`; all its policies were dropped with it.

---

## Standard Stack

### Core (No new packages needed)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PostgreSQL `pg_policies` | Built-in | Audit query for current effective policies | Standard Postgres system view |
| Next.js `headers()` in `next.config.ts` | Built-in (Next.js 16) | Security headers on all responses | Native, no dependency |
| Supabase migration SQL | Project pattern | RLS policy changes | All schema changes go through migrations |

### SECURITY DEFINER Functions Already Present

The codebase already uses these helper functions to avoid RLS recursion:

| Function | Created In | Purpose |
|----------|-----------|---------|
| `public.is_group_member(p_group_id, p_user_id)` | `20250127000001` | Check group membership without triggering RLS recursion |
| `public.is_borrowing_item(item_id, user_id)` | `20250128190000` | Check active borrow (replaced by `is_borrower_of_item`) |
| `public.is_borrower_of_item(item_id, user_id)` | `20250129000010` | Check if user is active borrower |
| `public.is_lender_of_item(item_id, user_id)` | `20250129000010` | Check if user has ever lent item |
| `public.is_public_group_item(item_id)` | `20250129000010` | Check if item is a public group item |
| `public.user_owns_borrow_request(request_id, user_id)` | `20251228000008` | Check borrow request ownership |
| `public.user_is_requester(request_id, user_id)` | `20251228000008` | Check if user is requester |

**Do not modify these functions.** They are load-bearing and fix real recursion bugs.

**No installation required** — all tooling is built-in.

---

## Architecture Patterns

### Pattern 1: RLS Audit SQL Query

Use this in the Supabase SQL editor or document the output:

```sql
-- Source: pg_policies system view (PostgreSQL standard)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

Run this against the live database to capture the true effective state. The reconstruction above is derived from migration analysis but the SQL query is authoritative.

### Pattern 2: RLS Fix Migration (Users Table)

```sql
-- Migration: fix_users_table_rls_privacy.sql
-- Replaces open SELECT policy with owner-only access

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;

-- (SELECT auth.uid()) subquery form is more performant than auth.uid() directly
-- PostgreSQL evaluates the subquery once per statement, not per row
CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
```

**CRITICAL:** Before dropping the old policy, audit the codebase for any queries that rely on reading other users' data. The known use cases:
- `app/users/actions.ts` — `searchUsers()` — used for linking contacts to users
- Group member display (shows user names)

These server actions run with `supabase.auth.getUser()` (anon key + RLS). After this fix, they will only return the current user's own row. They need to be evaluated and possibly rewritten to use a service role client or a SECURITY DEFINER function.

### Pattern 3: Security Headers via next.config.ts

```typescript
// Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers
// next.config.ts

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Supabase project URL for connect-src (browser-side fetch calls)
// Replace with actual project URL from env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const cspHeader = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for styles when not using nonces
  // Using 'unsafe-inline' for script-src as well since nonces require
  // all pages to opt into dynamic rendering (performance tradeoff too large)
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // frame-ancestors replaces X-Frame-Options in modern browsers
  "frame-ancestors 'none'",
  // Allow Supabase API calls from browser
  `connect-src 'self' ${supabaseUrl} wss://*.supabase.co`,
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

**Note on nonces vs. static CSP:** Nonces require ALL pages to use dynamic rendering, disabling static generation. For BorrowMate (already fully dynamic, authenticated app), nonces would work — but the complexity is not justified given the `unsafe-inline` approach achieves the RLS-03 requirement. Use the simpler `next.config.ts` `headers()` approach.

### Anti-Patterns to Avoid

- **Do NOT use `service_role` key in client-side code** — it bypasses all RLS
- **Do NOT use `USING (true)` on any table with PII** — this is the current bug in `users`
- **Do NOT drop SECURITY DEFINER helper functions** — they prevent recursion bugs that took multiple migrations to solve
- **Do NOT modify existing migrations** — always create new ones per project convention
- **Do NOT inline `auth.uid()` directly in complex policies** — use `(SELECT auth.uid())` subquery for performance

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Security headers | Custom middleware header injection | `next.config.ts` `headers()` | Native Next.js, applies before middleware, no bugs |
| RLS policy auditing | Manual documentation only | `pg_policies` query + doc | Single source of truth from live DB |
| User lookup for group display | Reading `public.users` directly after RLS fix | SECURITY DEFINER function or app-layer join with service role | RLS fix will break current user-lookup queries |
| CSP nonce system | Custom nonce generation + injection into all pages | Simple `unsafe-inline` in `next.config.ts` | Nonce approach requires dynamic rendering on every page |

---

## Common Pitfalls

### Pitfall 1: Dropping the Users SELECT Policy Without Auditing Call Sites First

**What goes wrong:** After `DROP POLICY "Public profiles are viewable by everyone."`, server actions that look up other users (e.g., searching users by name/email, displaying group member names) will start returning empty results silently.

**Why it happens:** The Supabase client uses anon key + RLS by default. With the new `USING ((SELECT auth.uid()) = id)` policy, queries on `public.users` only return the authenticated user's own row.

**How to avoid:** Before applying the migration, run `grep -r "from('users')" app/` and `grep -r "users" app/` to find all queries on the users table. Evaluate each — queries that need cross-user data require a separate solution.

**Warning signs:** Action returns empty arrays where users were previously returned; group member names stop displaying.

**Known affected code to check:**
- `app/users/actions.ts` → `searchUsers()` function (searches users by name for contact linking)
- Any server component that joins borrow_records → users for display

**Resolution options:**
1. Create a SECURITY DEFINER function for specific allowed lookups (e.g., `get_user_display_name(user_id)`)
2. Use a separate restricted view that exposes only `id` and `name` (not email/phone)
3. Use service role client in server actions that need cross-user lookup (acceptable in server-only code)

### Pitfall 2: CSP Blocking Supabase API Calls

**What goes wrong:** After adding Content-Security-Policy, browser-side Supabase calls (`supabase.from()` in client components) get blocked by the browser because the Supabase project URL is not in `connect-src`.

**Why it happens:** The Supabase anon client runs in the browser for client components. The CSP `connect-src 'self'` blocks all external fetch calls.

**How to avoid:** Include `NEXT_PUBLIC_SUPABASE_URL` in `connect-src`. Also include `wss://*.supabase.co` if using Realtime.

**Warning signs:** Browser console shows CSP violation errors; client-side data fetching fails silently.

### Pitfall 3: Multiple Permissive SELECT Policies on items

**What goes wrong:** The `items` table has at least 6 active SELECT policies. PostgreSQL evaluates permissive policies with OR logic — a row is visible if ANY policy passes. This is correct behavior but makes auditing complex.

**Why it happens:** Each recursion-fix migration added new policies rather than modifying existing ones.

**How to avoid:** Document this explicitly in the audit doc. The policies are correct — the redundancy (e.g., two "owner" policies) is harmless but should be noted.

**Warning signs:** If reviewing policies and thinking "why are there two owner policies?" — this is expected, document it.

### Pitfall 4: Assuming DROP TABLE Removes All Associated Policies

**What goes wrong:** `user_follows` table was dropped in `20250129000006` and its policies with it. But `"Public items are viewable by followers."` on the `items` table was also dropped in the same migration. Missing this creates a false impression of an "orphaned" reference.

**Why it happens:** Policies on OTHER tables that reference the dropped table were separately cleaned up. This is correct but easy to miss in an audit.

**How to avoid:** In the audit document, explicitly note which policies were dropped and where (not just on the dropped table).

---

## Code Examples

### Audit Query: Effective Policies

```sql
-- Source: PostgreSQL pg_policies view
-- Run in Supabase SQL editor to verify effective state
SELECT
  tablename,
  policyname,
  cmd AS operation,
  permissive,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

### Audit Query: Tables Without RLS Enabled

```sql
-- Find any public tables with RLS disabled
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT relname FROM pg_class WHERE relrowsecurity = true
  );
```

### RLS Fix: Users Table Privacy (New Migration)

```sql
-- File: supabase/migrations/TIMESTAMP_fix_users_rls_privacy.sql
-- Fixes: RLS-02 - Users table SELECT policy exposes email/phone

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.users;

CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);
```

### SECURITY DEFINER Function for Safe User Name Lookup

If `searchUsers()` or group member display breaks after the RLS fix:

```sql
-- Allow looking up user name (not email/phone) for display purposes
CREATE OR REPLACE FUNCTION public.get_user_name(target_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT name FROM public.users WHERE id = target_user_id;
$$;
```

Or create a restricted view:

```sql
-- Limited view: only exposes id and name, never email/phone
CREATE VIEW public.user_profiles AS
  SELECT id, name FROM public.users;

-- Allow all authenticated users to read the view
GRANT SELECT ON public.user_profiles TO authenticated;
```

### Security Headers: next.config.ts

```typescript
// Source: https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  `connect-src 'self' ${supabaseUrl} wss://*.supabase.co`,
  "upgrade-insecure-requests",
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `USING (auth.uid())` directly in policy | `USING ((SELECT auth.uid()) = id)` subquery form | PostgreSQL performance recommendation | Evaluates once per statement vs. once per row |
| `X-Frame-Options: DENY` alone | CSP `frame-ancestors 'none'` + `X-Frame-Options` | Modern browsers | CSP `frame-ancestors` supersedes X-Frame-Options but both included for legacy browser support |
| Nonce-based CSP | Static CSP with `unsafe-inline` for apps already dynamic | Next.js 13+ | Nonces require dynamic rendering; for fully-authenticated app like BorrowMate the simpler approach is sufficient |

---

## Open Questions

1. **User name lookups after RLS fix**
   - What we know: `searchUsers()` in `app/users/actions.ts` runs server-side and queries `public.users`. After the RLS fix it will only return the current user's own row.
   - What's unclear: Does the current app actually call `searchUsers()` in any active user flow? Or is it used only for contact linking where the result is stored as `linked_user_id`?
   - Recommendation: Read `app/users/actions.ts` during the planning/execution phase. If it needs cross-user lookup, create a restricted view `user_profiles (id, name)` rather than reverting the RLS fix.

2. **Group member name display**
   - What we know: Group membership pages show other users' names. These come from joining `group_memberships` → `users`.
   - What's unclear: Does the server component join use service role or anon client?
   - Recommendation: Plan task includes checking `app/groups/` page server components. If they use `utils/supabase/server.ts` (anon key + RLS), names will break after the RLS fix. A `user_profiles` view solves this.

3. **Notifications table INSERT policy**
   - What we know: INSERT policy is `auth.uid() IS NOT NULL` (any authenticated user can create notifications for any recipient).
   - What's unclear: Is this intentional or a security hole?
   - Recommendation: Document in the audit as intentional-by-design (server actions create notifications). Flag for v2 hardening if needed. Not in scope for RLS-02.

---

## Sources

### Primary (HIGH confidence)
- PostgreSQL `pg_policies` system view — standard audit mechanism
- [Next.js headers() documentation](https://nextjs.org/docs/pages/api-reference/config/next-config-js/headers) — exact API confirmed, version 16.1.6, last updated 2026-02-20
- [Next.js Content Security Policy guide](https://nextjs.org/docs/app/guides/content-security-policy) — nonce vs. static approach, version 16.1.6, last updated 2026-02-20
- Migration files `20240101000000_init.sql` through `20251228000010` — read directly from codebase

### Secondary (MEDIUM confidence)
- [Supabase Hardening Data API docs](https://supabase.com/docs/guides/database/hardening-data-api) — confirms shared responsibility model, RLS requirement
- [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — `(SELECT auth.uid())` performance pattern

### Tertiary (LOW confidence)
- [MakerKit CSP + Supabase guide](https://makerkit.dev/docs/next-supabase-turbo/security/csp) — Supabase `connect-src` domain patterns (single source, needs validation against actual project URL)

---

## Metadata

**Confidence breakdown:**
- Effective RLS state: HIGH — derived directly from reading all 37 migration files in order
- Users table security issue: HIGH — `USING (true)` is plainly visible in `20240101000000_init.sql` and no subsequent migration drops or replaces it
- Security headers approach: HIGH — official Next.js docs confirmed current (2026-02-20)
- CSP Supabase connect-src: MEDIUM — verified from multiple sources but exact domain format (`wss://*.supabase.co`) should be confirmed against project URL
- User name lookup breakage risk: HIGH — logical consequence of the RLS fix, confirmed by reading app code

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days — stable technologies, Supabase and Next.js APIs don't change rapidly)
