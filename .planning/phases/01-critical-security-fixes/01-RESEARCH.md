# Phase 1: Critical Security Fixes - Research

**Researched:** 2026-02-22
**Domain:** Next.js middleware auth guards, server action authentication, sensitive data exposure
**Confidence:** HIGH

## Summary

Phase 1 addresses three distinct but related security vulnerabilities in the BorrowMate codebase. The most critical is a broken middleware auth guard that effectively disables route protection for all authenticated routes -- the condition `!request.nextUrl.pathname.startsWith('/')` is always false since every pathname starts with `/`, meaning unauthenticated users can access any page. The second issue is a missing auth check in the `returnItem()` server action, allowing unauthenticated callers to modify borrow records and item statuses. The third is console.log/console.error statements that leak sensitive data (user IDs, error objects with internal details) to server logs and potentially browser consoles.

All three fixes are straightforward code changes that require no new dependencies, no database migrations, and no architectural changes. The existing `@supabase/ssr` + Next.js middleware pattern is correct in structure -- it just has a logic bug in the route-matching conditional. The server action fix follows the exact pattern already used in every other mutation action in the codebase. The console cleanup is a mechanical find-and-fix operation.

**Primary recommendation:** Fix the middleware conditional to use an explicit allowlist of public routes, add `getUser()` auth check to `returnItem()`, and audit all console statements for sensitive data exposure.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-01 | Middleware auth guard correctly protects all authenticated routes (fix broken startsWith logic) | Middleware bug fully diagnosed -- see "Architecture Patterns > Pattern 1" for the exact fix. The conditional on line 51 of `utils/supabase/middleware.ts` uses `!pathname.startsWith('/')` which is always false. Fix is to replace with explicit public route allowlist. |
| SEC-02 | `returnItem()` server action validates user authentication before processing | Missing auth check fully diagnosed -- see "Architecture Patterns > Pattern 2". The `returnItem()` function in `app/borrow/actions.ts` (line 74) never calls `supabase.auth.getUser()`. Every other mutation action in the codebase has this check. |
| SEC-03 | All console.log/console.error statements reviewed and sensitive data removed from output | Full audit completed -- see "Architecture Patterns > Pattern 3". Found 2 console.log statements leaking user IDs and item data, plus ~40 console.error statements logging full Supabase error objects. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^16.1.1 | App Router, middleware | Already installed; middleware.ts is the auth gateway |
| @supabase/ssr | ^0.7.0 | Server-side Supabase client with cookie auth | Already installed; provides `createServerClient` for middleware |
| @supabase/supabase-js | ^2.84.0 | Supabase client library | Already installed; provides `auth.getUser()` |

### Supporting
No new libraries needed for this phase. All fixes use existing dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual route allowlist | Next.js matcher config | Matcher only controls which routes middleware runs on, not auth logic within middleware. Both are needed. |
| Removing console.error entirely | Structured logging library (pino, winston) | Overkill for Phase 1. Remove sensitive data now; structured logging can be Phase 2+ |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Current File Structure (Relevant to Phase 1)
```
middleware.ts                          # Root middleware entry point
utils/supabase/middleware.ts           # updateSession() with auth guard bug
app/borrow/actions.ts                  # returnItem() missing auth check (line 74)
app/items/actions.ts                   # console.log with user IDs (lines 39, 53)
app/auth/actions.ts                    # console.error with full error object (line 69)
app/contacts/actions.ts                # console.error with JSON.stringify of errors
app/borrow/actions.ts                  # console.error with JSON.stringify of errors
app/groups/actions.ts                  # console.error statements
app/notifications/actions.ts           # console.error statements
app/users/actions.ts                   # console.error statements
components/*.tsx                       # Client-side console.error statements
```

### Pattern 1: Middleware Auth Guard Fix (SEC-01)

**What:** Fix the broken conditional in `utils/supabase/middleware.ts` that allows unauthenticated access to all routes.

**The Bug (line 49-56 of utils/supabase/middleware.ts):**
```typescript
// BROKEN: pathname.startsWith('/') is ALWAYS true, so the third
// condition always evaluates to false (!true = false).
// Combined with &&, the entire redirect block never executes.
if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/')  // <-- BUG: always true
    && request.nextUrl.pathname !== '/'
) {
    // This redirect NEVER fires
}
```

**The Fix:**
Replace with an explicit public route allowlist pattern. This is the standard approach recommended by Supabase docs and Next.js community patterns.

```typescript
// Source: Supabase official docs pattern + project-specific routes
const { data: { user } } = await supabase.auth.getUser()

// Define public routes that don't require authentication
const publicRoutes = ['/', '/auth', '/about']
const isPublicRoute = publicRoutes.some(
    route => request.nextUrl.pathname === route ||
             request.nextUrl.pathname.startsWith(route + '/')
)

if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
}
```

**Public routes in BorrowMate:**
- `/` -- Landing page
- `/auth` -- Login/signup page
- `/auth/callback` -- OAuth callback route
- `/about` -- Public about page

**Protected routes (everything else):**
- `/dashboard`
- `/items` and `/items/[id]` (including `/items/[id]/borrow`)
- `/contacts` and `/contacts/[id]`
- `/groups` and `/groups/[id]` (including `/groups/join/[inviteCode]`)
- `/borrow`
- `/discover`
- `/users/[id]`
- `/notifications`

### Pattern 2: Server Action Auth Check (SEC-02)

**What:** Add authentication validation to `returnItem()` in `app/borrow/actions.ts`.

**The Bug (line 74-101 of app/borrow/actions.ts):**
```typescript
// BROKEN: No auth check. Any caller can modify any borrow record.
export async function returnItem(recordId: string, itemId: string, groupId: string) {
    const supabase = await createClient()
    // Immediately performs mutations with no user validation
    const { error: borrowError } = await supabase
        .from('borrow_records')
        .update({ status: 'returned', returned_at: new Date().toISOString() })
        .eq('id', recordId)
    // ...
}
```

**The Fix:** Follow the exact pattern used in every other mutation action in the codebase:
```typescript
export async function returnItem(recordId: string, itemId: string, groupId: string) {
    const supabase = await createClient()

    // Auth check (same pattern as all other mutation actions)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Rest of existing logic...
}
```

**Important note:** While RLS policies provide a database-level safety net (Supabase anon key queries are constrained by RLS), the `returnItem()` function uses the Supabase server client which inherits the session from cookies. Without an explicit auth check, a request with no valid session cookie would use the anon key's permissions, and RLS on `borrow_records` and `items` may or may not block the mutation depending on policy configuration. The auth check is the correct defense-in-depth approach, consistent with every other mutation in the codebase.

### Pattern 3: Console Statement Audit (SEC-03)

**What:** Review and sanitize all console.log/console.error statements to prevent sensitive data exposure.

**Severity levels found:**

**HIGH risk (must fix):**
- `app/items/actions.ts:39` -- `console.log('Creating item:', { ..., owner_user_id: user.id })` -- Logs the user's UUID
- `app/items/actions.ts:53` -- `console.log('Insert result:', { data, error })` -- Logs full insert result including IDs

**MEDIUM risk (should fix):**
- `app/contacts/actions.ts:28` -- `console.error('Error fetching contacts:', JSON.stringify(error, null, 2))` -- Full error serialization may include internal details
- `app/contacts/actions.ts:62` -- Same pattern with search contacts
- `app/borrow/actions.ts:318` -- `console.error('Error fetching active borrows:', JSON.stringify(error, null, 2))` -- Full error serialization
- `app/auth/actions.ts:69` -- `console.error(error)` -- Full auth error object

**LOW risk (cleanup recommended):**
- All other `console.error('Error [action]:', error)` statements across server actions (~30+ instances) -- These log Supabase PostgrestError objects which can contain table names, column names, and constraint details. Not directly user-facing in production but should be sanitized.
- Client-side `console.error` in components (notification-panel, contact-list-section, batch-lend-modal, etc.) -- These appear in browser dev tools but don't expose server-side secrets. Should still be cleaned up.

**Recommended approach:**
1. **Remove** all `console.log` statements entirely (they are debug leftovers)
2. **Replace** `console.error` with sanitized messages: log the error message string only, not the full error object
3. **Do NOT replace** with a logging framework in this phase -- that is scope creep. Simple removal/sanitization is sufficient.

```typescript
// Before (leaks internal details):
console.error('Error creating item:', error)

// After (safe):
// Option A: Remove entirely (simplest, recommended for most cases)
// Option B: Keep with sanitized message only
console.error('Error creating item:', error.message)
```

### Anti-Patterns to Avoid

- **Do not use `getSession()` for auth checks in server code:** Always use `getUser()` which validates the token with the Supabase auth server. `getSession()` reads from the cookie without server-side validation.
- **Do not add complex logging infrastructure in this phase:** The goal is to remove sensitive data from console output, not build a logging system.
- **Do not change the middleware matcher config to fix the auth bug:** The matcher controls which routes middleware runs on (correctly configured). The bug is in the auth logic within the middleware function.
- **Do not add auth checks to read-only server actions that return empty arrays:** Functions like `getContacts()`, `getUserItems()`, etc. already handle unauthenticated users by returning empty results. This is acceptable for read operations where RLS is the real guard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route protection | Custom auth HOC or layout wrapper | Middleware auth guard (already exists) | Middleware runs before rendering, single point of enforcement |
| Session validation | Manual JWT parsing | `supabase.auth.getUser()` | Validates with auth server, handles token refresh |
| Cookie management | Manual cookie read/write | `@supabase/ssr` createServerClient | Handles cookie serialization, SameSite, secure flags |

**Key insight:** The existing infrastructure is correct. This phase is about fixing bugs in existing code, not building new systems.

## Common Pitfalls

### Pitfall 1: startsWith('/') Always Matches
**What goes wrong:** Using `pathname.startsWith('/')` as a condition to identify the root route. Every URL pathname starts with `/`, so this is always true.
**Why it happens:** Developer intended to check "is this the root page?" but used `startsWith` instead of strict equality `=== '/'`.
**How to avoid:** Use strict equality for exact route matches. Use `startsWith('/auth')` only for prefix-based route groups.
**Warning signs:** Auth middleware that seems to have no effect when tested.

### Pitfall 2: Forgetting Auth Check in New Server Actions
**What goes wrong:** A server action performs mutations without checking `getUser()` first.
**Why it happens:** Developer copies a read-only action pattern (which gracefully returns empty) and adds mutations without adding the auth gate.
**How to avoid:** Every mutation server action MUST start with the auth check pattern. Consider adding a comment template.
**Warning signs:** Server action that calls `.insert()`, `.update()`, or `.delete()` without a preceding `getUser()` call.

### Pitfall 3: console.error Leaking Supabase Error Objects
**What goes wrong:** `console.error('msg', error)` logs the full PostgrestError object which includes `message`, `details`, `hint`, `code` -- potentially exposing table structure and constraint names.
**Why it happens:** Standard error logging practice from development that persists into production.
**How to avoid:** Only log `error.message` string, never the full error object. Or remove console.error entirely and rely on function return values.
**Warning signs:** `JSON.stringify(error, null, 2)` in server actions is the most explicit leak pattern.

### Pitfall 4: Auth Callback Route Must Remain Public
**What goes wrong:** The auth guard blocks `/auth/callback` and OAuth login flow breaks silently.
**Why it happens:** Developer adds `/auth` to public routes but the callback at `/auth/callback` is a separate route handler.
**How to avoid:** When using prefix matching `startsWith('/auth')`, the callback is automatically included. If using exact matches, explicitly include `/auth/callback`.
**Warning signs:** OAuth login redirects to auth page instead of completing the flow.

### Pitfall 5: Group Join Route Access
**What goes wrong:** `/groups/join/[inviteCode]` requires authentication, but a user clicking an invite link while logged out should be redirected to auth and then back to the join page.
**Why it happens:** Invite links are shared externally. Recipients may not be logged in.
**How to avoid:** Keep this as a protected route (require login). The redirect to `/auth` will happen, and after login the user can revisit the link. Consider storing the invite URL in a `next` param for post-login redirect (but this is a future enhancement, not Phase 1 scope).
**Warning signs:** Users report invite links "not working" -- they were redirected to auth and lost the invite URL.

## Code Examples

Verified patterns from the existing codebase:

### Standard Auth Check Pattern (from app/contacts/actions.ts)
```typescript
// Source: app/contacts/actions.ts:69-75 (existing pattern used in 15+ server actions)
export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }
  // ... rest of mutation logic
}
```

### Middleware Public Route Pattern
```typescript
// Source: Supabase official docs + adapted for BorrowMate routes
const publicRoutes = ['/', '/auth', '/about']
const isPublicRoute = publicRoutes.some(
    route => request.nextUrl.pathname === route ||
             request.nextUrl.pathname.startsWith(route + '/')
)

if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
}
```

### Sanitized Error Logging
```typescript
// Instead of: console.error('Error creating item:', error)
// Use: (remove entirely or log only the message)
if (error) {
    return { error: error.message }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `supabase.auth.getSession()` | `supabase.auth.getUser()` | @supabase/ssr v0.4+ (2024) | getUser validates token server-side; getSession only reads cookie |
| Auth helpers package | @supabase/ssr | 2024 | Unified SSR auth package for all frameworks |
| Manual cookie handling | @supabase/ssr createServerClient | 2024 | Automatic cookie management with proper SameSite/Secure flags |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. BorrowMate already uses the current package.
- `supabase.auth.getSession()` for server-side checks: Deprecated in favor of `getUser()` for security. BorrowMate already uses `getUser()` in most places.

## Open Questions

1. **Should we add a `next` query parameter for post-login redirects?**
   - What we know: When middleware redirects to `/auth`, the original destination URL is lost
   - What's unclear: Whether this is in scope for Phase 1
   - Recommendation: Out of scope for Phase 1. The fix ensures auth protection works; UX improvements to the redirect flow can come later. Note: the `auth/callback/route.ts` already handles a `next` parameter.

2. **Should `returnItem()` also verify the user is the lender/owner before allowing the return?**
   - What we know: Currently it takes recordId/itemId as params and updates without ownership verification. RLS may or may not enforce this.
   - What's unclear: What the RLS policies allow for borrow_records updates
   - Recommendation: Adding auth check (SEC-02) is the minimum. Authorization (is this user the lender?) would be ideal but is a separate concern. Add the auth check now; authorization audit is part of Phase 4 (RLS-01).

3. **Should client-side console.error statements in components be removed too?**
   - What we know: Components like `notification-panel.tsx`, `contact-list-section.tsx`, `batch-lend-modal.tsx` have console.error calls. These appear in browser devtools.
   - What's unclear: Whether these expose sensitive data to end users
   - Recommendation: Include in the SEC-03 audit. Client-side errors showing Supabase error messages could reveal API structure. At minimum, sanitize to show user-friendly messages. The SEC-03 requirement says "No sensitive user data appears in browser console during normal app usage" -- this includes client-side logging.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Direct examination of `utils/supabase/middleware.ts`, `app/borrow/actions.ts`, and all `actions.ts` + component files
- [Supabase official docs: Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) -- Middleware pattern, getUser() vs getSession() guidance
- [Supabase GitHub Discussion #21468](https://github.com/orgs/supabase/discussions/21468) -- Community patterns for route protection with @supabase/ssr

### Secondary (MEDIUM confidence)
- [Next.js middleware documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware) -- Middleware matcher configuration and execution model
- [Supabase Advanced SSR Guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) -- Additional middleware patterns

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources and direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new libraries needed; existing stack is correct
- Architecture: HIGH -- Bugs are clearly identified with exact line numbers; fix patterns match existing codebase conventions
- Pitfalls: HIGH -- Based on direct code analysis of the specific bugs, not theoretical concerns

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (30 days -- stable patterns, no rapidly changing dependencies)
