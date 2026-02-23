# Domain Pitfalls

**Domain:** Security hardening & UI design system refinement for existing Next.js + Supabase lending app
**Researched:** 2026-02-22
**Overall confidence:** HIGH (based on codebase audit + verified community patterns)

---

## Critical Pitfalls

Mistakes that cause security breaches, data leaks, or full rewrites.

### Pitfall 1: Middleware Auth Guard is Effectively Disabled

**What goes wrong:** The current middleware at `utils/supabase/middleware.ts` line 52 contains `!request.nextUrl.pathname.startsWith('/')` as a condition in the auth guard. Since EVERY path starts with `/`, this condition is always `false`, making the entire `&&` chain always `false`. The redirect to `/auth` never fires. All routes are effectively unprotected at the middleware level.

**Why it happens:** A development-time "let me think about this later" comment became permanent code. The condition was left with a logical error during initial prototyping.

**Consequences:** Any unauthenticated user can access `/dashboard`, `/items`, `/contacts`, `/groups`, and every other route directly. The individual server actions do check `auth.getUser()` and return early, so data is not immediately exposed -- but the pages themselves render without auth, potentially leaking UI structure and causing confusing blank-state experiences. If any server component fails to check auth, data leaks.

**Prevention:**
- Fix the middleware condition immediately. Replace with an explicit allowlist of public routes (e.g., `/`, `/auth`, `/auth/callback`). Everything else redirects.
- Pattern: `const publicPaths = ['/', '/auth', '/auth/callback']; const isPublic = publicPaths.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + '/'));`
- Add an integration test that verifies unauthenticated requests to `/dashboard` get a 302 redirect.

**Detection:** Try accessing `/dashboard` in an incognito browser window. If it loads (even as an empty page), the guard is broken.

**Phase:** Address in the very first security hardening task. This is a blocker for production.

**Confidence:** HIGH -- verified by direct codebase reading.

---

### Pitfall 2: Server Actions Have Zero Input Validation

**What goes wrong:** Every server action uses `formData.get('field') as string` with no validation whatsoever. The `as string` cast silently converts `null` to the string `"null"`, and no length limits, format checks, or sanitization are applied. An attacker can POST arbitrary data to any server action endpoint.

**Why it happens:** Rapid prototyping with the mindset "Supabase handles the schema." FormData casts feel type-safe in TypeScript but they are not -- `as string` is a lie to the compiler.

**Consequences:**
- Inserting items with empty names, extremely long strings, or malformed UUIDs for `groupId`/`contactId`.
- The `searchContacts` action passes user input directly into a `%${query}%` ilike filter. While Supabase parameterizes queries (preventing SQL injection), the search term has no length limit or character sanitization, enabling resource-exhaustion attacks.
- `batchLendToContact` accepts `itemIds: string[]` with no length validation -- an attacker could pass thousands of IDs causing a large `IN` clause query.

**Prevention:**
- Add Zod schemas for every server action. Create a shared `lib/validations/` directory with schemas per domain (items, contacts, borrow, groups, auth).
- Use `z.string().min(1).max(255)` for names, `z.string().uuid()` for IDs, `z.string().email().optional()` for emails, `z.array(z.string().uuid()).max(50)` for batch operations.
- Validate with `schema.safeParse()` at the top of each action; return structured error if invalid.
- Do NOT change function signatures during retrofitting -- keep the same `FormData` or argument shapes, just add validation inside.

**Detection:** Try creating an item with an empty name field or submitting a 10,000-character description. If it succeeds, validation is missing.

**Phase:** Security hardening phase, immediately after fixing middleware. Can be done action-by-action incrementally.

**Confidence:** HIGH -- verified by direct codebase reading. Validated by [Next.js security docs](https://nextjs.org/blog/security-nextjs-server-components-actions) and [MakerKit security guide](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions).

---

### Pitfall 3: RLS Policy Sprawl and Circular Dependency Debt

**What goes wrong:** The codebase has 37+ migrations, with at least 8 specifically fixing RLS recursion bugs (infinite recursion between `items` <-> `borrow_records` policies). Each fix adds more `SECURITY DEFINER` functions. The total policy surface is now complex, fragmented across many files, and difficult to reason about holistically.

**Why it happens:** RLS policies were added reactively as features grew. Each new table relationship (contacts, borrow_requests, notifications) introduced new policy requirements that conflicted with existing ones. SECURITY DEFINER functions were used to break recursion but they bypass RLS themselves, creating a secondary trust surface.

**Consequences:**
- New features or schema changes can trigger new recursion cycles that only manifest at runtime.
- SECURITY DEFINER functions execute with creator (postgres) privileges, meaning bugs in these functions bypass ALL security.
- No single document describes what the current effective RLS policy set actually is -- you must read 37 migration files in order.
- Testing RLS is difficult: the SQL editor bypasses RLS, so manual testing in the Supabase dashboard does not catch issues.

**Prevention:**
- Before modifying any RLS, create a single `docs/RLS_AUDIT.md` that documents every table's effective policies by reading all migrations in order. This is the map you need before changing anything.
- Use `security invoker` views instead of `security definer` functions where possible (Postgres 15+ feature, available in Supabase).
- Test RLS through the Supabase client SDK (not SQL editor). Write a script that authenticates as different users and verifies what data each can see.
- When adding new policies, always check for circular references: "Does table A's policy reference table B? Does table B's policy reference table A?"
- Index every column referenced in RLS policies (`user_id`, `owner_user_id`, `lender_user_id`, `contact_id`) for performance.

**Detection:** The `infinite recursion detected in policy for relation` error at runtime. Or: RLS test script returns data a user should not see.

**Phase:** Security audit phase. Must be done before any schema changes. The audit document should be created first, then policies consolidated.

**Confidence:** HIGH -- verified by codebase inspection of migration files. Corroborated by [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Supabase community discussions on recursion](https://github.com/orgs/supabase/discussions/1138).

---

### Pitfall 4: returnItem() Has No Authentication Check

**What goes wrong:** The `returnItem` function in `app/borrow/actions.ts` (line 74) does not call `supabase.auth.getUser()`. It directly updates the borrow record and item status using only the provided `recordId` and `itemId` parameters. While RLS update policies require `auth.uid() = lender_user_id OR auth.uid() = borrower_user_id`, a completely unauthenticated request could still reach this function since middleware protection is broken (Pitfall 1).

**Why it happens:** The function was written early in development, likely copying from a pattern where the Supabase client was assumed to always have an authenticated session. The auth check that exists in every other action was simply missed.

**Consequences:** Combined with the broken middleware, any unauthenticated user could potentially trigger item returns if they can guess or enumerate record/item UUIDs. Even with working middleware, server actions should never rely solely on middleware for auth -- defense in depth requires checking at the action level too.

**Prevention:**
- Add `const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: 'Not authenticated' }` to `returnItem()`.
- Audit every server action export for auth checks. Create a checklist: every exported `async function` in an `actions.ts` file must have an auth guard as its first operation.
- Consider a wrapper function: `async function withAuth(fn: (user: User, supabase: Client) => Promise<T>)` that handles the auth check pattern.

**Detection:** Search for `export async function` in action files and verify each has `getUser()` within the first 5 lines.

**Phase:** First security pass, alongside middleware fix.

**Confidence:** HIGH -- verified by direct code reading of `app/borrow/actions.ts` line 74-101.

---

## Moderate Pitfalls

### Pitfall 5: Big-Bang UI Rewrite Breaks Working Features

**What goes wrong:** Attempting to replace all component styling at once across 29 components (the current count) introduces visual regressions that are hard to catch without automated visual testing. Components that "look fine" in light mode break in dark mode or vice versa.

**Why it happens:** The codebase uses three different styling approaches simultaneously:
1. CSS utility classes in `globals.css` (`.btn-primary`, `.card`, `.badge-success`) using CSS variables
2. Inline Tailwind classes with `dark:` prefix variants (e.g., `dark:bg-gray-800`, `dark:border-gray-700`) -- 136 occurrences across 15 files
3. Hardcoded `bg-white` in 37 occurrences across 17 files, which does not respond to dark mode at all

Developers naturally try to "fix everything at once" when they see this inconsistency.

**Prevention:**
- Adopt an incremental, component-by-component approach. Never refactor more than 2-3 components in a single PR.
- Establish the design system primitives FIRST (Button, Input, Card, Modal, Badge) as React components that use the CSS variable system.
- Then migrate page by page: replace inline `dark:bg-gray-800` / `bg-white` with the design system components.
- Track progress with a component migration checklist.
- Every migrated component should be visually verified in BOTH light and dark mode before moving on.
- The globals.css utility classes (`.btn-primary`, etc.) are a reasonable intermediate step but should eventually become React components for composability.

**Detection:** After any UI change, toggle dark/light mode and check every affected page. If a component uses `bg-white` without a dark mode counterpart, it will appear as a white box on a dark background.

**Phase:** UI design system phase. Build primitives first, then migrate incrementally.

**Confidence:** HIGH -- verified by codebase grep showing mixed approaches. Supported by [incremental migration best practices](https://altersquare.io/how-teams-incrementally-modernize-large-frontend-codebases/).

---

### Pitfall 6: Hardcoded Colors Break Dark Mode Systematically

**What goes wrong:** The codebase defines proper CSS variables (`--bg-base`, `--bg-surface`, `--text-primary`, etc.) in `globals.css` and has utility classes that use them. But components bypass this system by using hardcoded Tailwind colors: `bg-white` (37 uses), `text-gray-700` (without dark variant), `border-gray-200` (without dark variant). The `BatchLendModal` is the worst offender -- it uses `bg-white`, `text-gray-500`, `text-gray-700`, `bg-gray-50`, `border-gray-200` throughout, with zero dark mode support.

**Why it happens:** Rapid development. Tailwind's color palette is faster to type than CSS variable classes. Some components were copied from UI examples that assume light mode only.

**Consequences:** The modal and several other components look completely broken in dark mode (white backgrounds on dark pages, invisible text). Users toggling dark mode see a jarring mix of themed and unthemed elements.

**Prevention:**
- Create a strict mapping: `bg-white` -> use CSS variable `bg-base` or design system component; `bg-gray-50` -> `bg-surface`; `text-gray-700` -> `text-text-secondary`.
- The existing CSS variables are well-designed. The problem is adoption, not design.
- Consider adding an ESLint rule or grep check that flags `bg-white`, `bg-gray-`, `text-gray-` without corresponding `dark:` variants in `.tsx` files.
- Prioritize modals first (they render on top of everything and the contrast is most visible).

**Detection:** `grep -r "bg-white" components/ --include="*.tsx" | wc -l` -- if the count is greater than zero in components that should support dark mode, this pitfall exists.

**Phase:** UI design system phase, during component migration.

**Confidence:** HIGH -- verified by codebase grep.

---

### Pitfall 7: Console Logging in Production Leaks Internal Details

**What goes wrong:** There are 43 `console.log` and `console.error` calls across server action files. These log Supabase error objects, user IDs, item details, and creation parameters directly to stdout. In production, these logs may be captured by hosting platform log collectors (Vercel logs are visible in the dashboard) and could expose internal database schema details, error messages with SQL details, and user data.

**Why it happens:** Standard development debugging pattern. No logging framework was set up.

**Consequences:** Supabase error messages can reveal table names, column names, and RLS policy details. The `createItem` action logs the full insert payload including `owner_user_id`. In a multi-user production environment, this is a data handling concern.

**Prevention:**
- Replace `console.log` debug statements with conditional logging: only log in development (`process.env.NODE_ENV === 'development'`).
- Replace `console.error` with a structured logger that redacts sensitive fields (user IDs, emails) in production.
- For now, the simplest fix: delete all `console.log` calls in actions and wrap `console.error` with a helper that strips PII.

**Detection:** Run `grep -r "console.log" app/ --include="*.ts" | wc -l`. Any count above zero in production-facing code is a flag.

**Phase:** Security hardening phase, lower priority than auth/validation fixes but should be done before production launch.

**Confidence:** HIGH -- verified by codebase grep (43 occurrences).

---

### Pitfall 8: Non-Atomic Multi-Step Operations Leave Inconsistent State

**What goes wrong:** `batchLendToContact` inserts borrow records, then updates item statuses as two separate operations. If the item status update fails after borrow records are created, the database is left in an inconsistent state: borrow records exist but items still show as "available." Similarly, `returnItem` updates the borrow record status then the item status in two steps.

**Why it happens:** Supabase JS client does not support client-side transactions. Each `.insert()` and `.update()` call is a separate HTTP request to the PostgREST API.

**Consequences:** Race conditions in concurrent usage (two users trying to lend the same item simultaneously). Partial failures leave orphaned borrow records or items stuck in wrong status.

**Prevention:**
- For critical multi-step operations, use a Supabase database function (RPC) that wraps the operations in a single transaction.
- Example: `CREATE FUNCTION lend_items(item_ids uuid[], contact_id uuid, ...) RETURNS ... AS $$ BEGIN ... COMMIT; END; $$`
- For the current state, add error recovery: if the second operation fails, attempt to roll back the first.
- At minimum, add a `status check before update` pattern: verify item status is 'available' at update time using `.eq('status', 'available')` to prevent concurrent lending.

**Detection:** Two browser tabs, same account, try to lend the same item to different contacts simultaneously. If both succeed, the race condition exists.

**Phase:** Security hardening phase, after basic auth/validation work.

**Confidence:** MEDIUM -- race condition severity depends on user concurrency patterns. Pattern is well-documented in [Supabase community](https://www.leanware.co/insights/supabase-best-practices).

---

### Pitfall 9: Retrofitting Zod Validation Breaks FormData Contracts

**What goes wrong:** Adding Zod validation to existing server actions changes error shapes. Code that currently checks `if (result?.error)` and displays `result.error` (a string) will break if Zod errors return a different shape (e.g., `result.errors` as an array, or `result.fieldErrors` as an object). Client components that call these actions expect specific return types.

**Why it happens:** Zod's `safeParse` returns `{ success: false, error: ZodError }` with `.flatten()` or `.format()` methods, which produce different shapes than the current `{ error: string }` convention.

**Consequences:** Forms display "[object Object]" instead of error messages. Or worse: validation errors are silently swallowed because the client checks `result.error` (string) but gets `result.errors` (array).

**Prevention:**
- Define a standard action response type FIRST: `type ActionResponse<T> = { data: T; error?: never } | { data?: never; error: string; fieldErrors?: Record<string, string[]> }`.
- When adding Zod, always format errors into this standard shape before returning: `return { error: zodResult.error.errors[0].message }` for backward compatibility.
- Migrate the return type progressively: first maintain the `{ error: string }` convention, then later enhance to include field-level errors when the client components are ready to consume them.
- Add TypeScript return types to every server action to catch shape mismatches at compile time.

**Detection:** After adding Zod to an action, test every client component that calls it with invalid input. If the error message doesn't display correctly, the contract broke.

**Phase:** Security hardening (validation). Must be deliberate about maintaining backward compatibility with existing client components.

**Confidence:** HIGH -- this is a well-documented pattern issue. Supported by [FreeCodeCamp guide](https://www.freecodecamp.org/news/handling-forms-nextjs-server-actions-zod/) and [Next.js discussions](https://github.com/vercel/next.js/discussions/86447).

---

## Minor Pitfalls

### Pitfall 10: Users Table Exposes All Profiles Publicly

**What goes wrong:** The initial RLS policy on the `users` table is `"Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true)`. This means any authenticated user can query ALL user profiles including emails. The `searchUsers` function in `groups/actions.ts` already exploits this by allowing any user to search all users by name or email.

**Prevention:** Tighten the users SELECT policy to only allow viewing users who share a group or have a contact linkage. Or at minimum, restrict which columns are visible (name but not email) for non-connected users.

**Phase:** Security audit phase.

**Confidence:** HIGH -- verified in `20240101000000_init.sql` line 18-20.

---

### Pitfall 11: Design System Tokens Not Connected to Tailwind Config

**What goes wrong:** The CSS variables in `globals.css` (`--bg-base`, `--bg-surface`, etc.) exist but are referenced via `style` attributes or inline `background-color: var(--bg-surface)` in CSS, not as first-class Tailwind utilities. Developers must remember to use the CSS classes (`.card`, `.btn-primary`) instead of Tailwind primitives, which fights against Tailwind's composability model.

**Prevention:** In Tailwind v4, register these CSS variables as theme tokens using `@theme` so they become `bg-base`, `bg-surface`, `text-text-primary`, etc. This lets developers use them naturally in Tailwind classes without remembering to use utility classes.

**Phase:** UI design system phase, as a foundational step before component migration.

**Confidence:** MEDIUM -- Tailwind v4 `@theme` approach verified by [Tailwind v4 docs](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices). Implementation specifics need validation.

---

### Pitfall 12: No Rate Limiting on Server Actions

**What goes wrong:** Server actions are public HTTP endpoints. Without rate limiting, an attacker can hammer `searchContacts`, `searchUsers`, or `createContact` thousands of times per second.

**Prevention:** Add rate limiting via Vercel's Edge Config, or use a library like `arcjet` or `upstash/ratelimit` for per-IP or per-user rate limits on sensitive actions. Prioritize: auth actions (login, signup), search actions, and write actions.

**Phase:** Security hardening, after auth and validation are fixed.

**Confidence:** MEDIUM -- standard security practice, verified by [Arcjet blog on server action security](https://blog.arcjet.com/next-js-server-action-security/).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Middleware fix | Breaking auth for OAuth callback route | Explicitly allowlist `/auth/callback` in public routes |
| Input validation (Zod) | Changing error return shapes breaks client | Define standard `ActionResponse` type first, maintain `{ error: string }` contract |
| RLS audit | Accidentally dropping a needed policy | Create full audit document BEFORE modifying any policy; test with client SDK not SQL editor |
| RLS audit | SECURITY DEFINER functions bypass all security | Audit each function, ensure they only do narrow existence checks |
| Design system primitives | Over-engineering component API | Keep primitives minimal (variant + size + className). Do not add every possible prop up front |
| Component migration | Introducing dark mode regressions | Always test both modes for every changed component; consider visual snapshot testing |
| Component migration | CSS specificity conflicts between globals.css classes and Tailwind | Migrate away from globals.css utility classes toward React component primitives over time |
| Console logging cleanup | Losing ability to debug production issues | Replace with structured logging (e.g., a `logger.ts` wrapper) not just deletion |
| Batch operations | Race conditions in concurrent lending | Use Supabase RPC for transactional operations |

---

## Sources

- [Next.js Security for Server Components and Actions](https://nextjs.org/blog/security-nextjs-server-components-actions) -- Official Next.js security guidance (HIGH confidence)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Official RLS documentation (HIGH confidence)
- [MakerKit: 5 Next.js Server Action Vulnerabilities](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions) -- Server action security patterns (MEDIUM confidence)
- [Arcjet: Next.js Server Action Security](https://blog.arcjet.com/next-js-server-action-security/) -- Rate limiting and protection patterns (MEDIUM confidence)
- [Supabase RLS Recursion Discussion](https://github.com/orgs/supabase/discussions/1138) -- Circular RLS dependency patterns (HIGH confidence)
- [Supabase Security Best Practices 2026](https://supaexplorer.com/guides/supabase-security-best-practices) -- General Supabase security (MEDIUM confidence)
- [Supabase Security Flaw: 170+ Apps Exposed](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) -- Real-world RLS failure case study (HIGH confidence)
- [FreeCodeCamp: Forms with Server Actions and Zod](https://www.freecodecamp.org/news/handling-forms-nextjs-server-actions-zod/) -- Zod validation migration patterns (MEDIUM confidence)
- [Tailwind CSS v4 Migration Best Practices](https://www.digitalapplied.com/blog/tailwind-css-v4-2026-migration-best-practices) -- Tailwind v4 migration pitfalls (MEDIUM confidence)
- [Incremental Frontend Modernization](https://altersquare.io/how-teams-incrementally-modernize-large-frontend-codebases/) -- Component migration strategy (MEDIUM confidence)
- [Precursor Security: Row-Level Recklessness](https://www.precursorsecurity.com/security-blog/row-level-recklessness-testing-supabase-security) -- RLS penetration testing patterns (MEDIUM confidence)
- Direct codebase audit of BorrowMate repository (HIGH confidence)
