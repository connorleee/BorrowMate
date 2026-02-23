# Feature Research: Security Hardening & UX Refinement

**Domain:** Contact-centric item lending web app (security audit + UX polish milestone)
**Researched:** 2026-02-22
**Confidence:** HIGH (security patterns well-documented; UX patterns grounded in codebase audit)

## Feature Landscape

### Table Stakes: Security (Must Have for Production)

Features that are non-negotiable before accepting public signups. Missing any of these creates real vulnerability.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Server action input validation with Zod | All server actions currently use raw `formData.get() as string` casts with zero validation. Any server action is a public HTTP endpoint -- attackers can send arbitrary payloads. This is the single highest-priority security fix. | MEDIUM | Add Zod schemas to every server action. Pattern: define schema, `safeParse()`, return early on failure. Share schemas between client/server for consistent validation. Install `zod` (no other deps needed). |
| UUID parameter validation | Actions like `deleteItem(itemId)`, `returnItem(recordId, itemId, groupId)` accept raw strings that go directly into DB queries. Malformed UUIDs could cause unexpected behavior. | LOW | Validate all ID parameters are valid UUIDs before querying. Simple Zod `z.string().uuid()` check. |
| Authorization checks on all mutations | `returnItem()` has NO auth check at all -- anyone can mark any item as returned. `borrowItem()` does not verify the caller owns the item or is a group member. Several actions rely solely on RLS without server-side verification. | MEDIUM | Every mutation must: (1) verify auth, (2) verify the user has permission for this specific resource. RLS is defense-in-depth, not the only layer. |
| Middleware route protection fix | Current middleware has a logic bug: the condition `!request.nextUrl.pathname.startsWith('/')` is always false (every path starts with `/`), meaning NO routes are actually protected by middleware. | LOW | Fix the middleware condition to properly protect `/dashboard`, `/items`, `/contacts`, `/groups`, `/borrow`, and `/notifications` routes. Only `/`, `/auth`, and `/about` should be public. |
| RLS policy audit and hardening | 37 migrations have accumulated policy changes. Need systematic review: are there tables missing policies? Policies that are too permissive? The `users` table has `select` open to everyone (`using (true)`), exposing all user emails/phones. | MEDIUM | Audit every table's RLS policies against least-privilege. The `users` table `select` policy should NOT expose phone/email to all authenticated users. `searchUsers()` in groups/actions.ts passes user-input directly into `.or()` filter without sanitization. |
| Remove console.log of sensitive data | `createItem()` logs full item data including user ID. Multiple actions log full error objects. Production logging should not contain PII or expose internal structure. | LOW | Remove all `console.log` calls with user data. Replace `console.error` with structured error returns (no internal details to client). |
| Security headers (CSP, X-Frame-Options, etc.) | No security headers configured. Missing Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Required by OWASP standards. | LOW | Add headers in `next.config.js` or middleware. Standard set: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, basic CSP. |
| Environment variable hygiene | `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed (expected). Must verify `SUPABASE_SERVICE_ROLE_KEY` is never used client-side. Verify `.env` is in `.gitignore`. | LOW | Audit env usage. Install `server-only` package and add to any module that touches secrets or DB directly. Verify `.env*` in `.gitignore`. |

### Table Stakes: UX (Users Expect This Polish)

Features users expect from any production web app. Missing these makes the app feel unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Toast notification system for action feedback | Currently, server actions return `{ error }` or `{ success }` but the UI has no consistent way to show these to users. Failed operations are silent. Users have no idea if lending, returning, or deleting succeeded or failed. | LOW | Install Sonner (lightweight, works with server actions). Wrap all action calls with toast feedback. Pattern: `toast.promise()` for async operations. |
| Empty states for all list views | Dashboard, contacts, items, groups pages show nothing when empty. First-time users see a blank page with no guidance on what to do next. | LOW | Add empty state components with illustration/icon, explanatory text, and primary CTA ("Add your first item", "Create a contact"). One reusable `EmptyState` component with customizable props. |
| Loading states and skeleton screens | No loading indicators anywhere. Page transitions feel broken -- users see stale data or blank areas while data loads. Server components load fast but client interactions have no feedback. | MEDIUM | Add `loading.tsx` files for route segments. Add skeleton components for cards, lists, and detail views. Use Suspense boundaries around data-heavy sections. |
| Form validation with inline error messages | Forms currently have no client-side validation. Users can submit empty forms and only see errors after a round-trip. No visual indication of which field has errors. | MEDIUM | Zod schemas (shared with server validation) + inline error display. Use `aria-invalid` and `aria-describedby` for accessibility. Show errors per-field, not just a single error banner. |
| Consistent component design system | Buttons, cards, forms, and modals all have slightly different styling across pages. Some use CSS classes from globals.css (`.btn-primary`), others use inline Tailwind. Spacing and sizing varies. | MEDIUM | Standardize on a small set of reusable components: Button, Card, Input, Modal, Badge, EmptyState. Define once with consistent props (variant, size), use everywhere. NOT a full component library -- just the 6-8 components this app actually uses. |
| Responsive mobile experience | App has basic `md:` breakpoints but sidebar navigation assumes desktop. Mobile users need a working navigation pattern (hamburger menu or bottom nav). | MEDIUM | Sidebar already collapses on mobile via `SidebarClientContent`. Verify all modals, forms, and lists work on small screens. Test batch lend modal specifically (multi-select on mobile is tricky). |
| Confirmation dialogs for destructive actions | Delete item, delete contact have no confirmation. One accidental tap and data is gone. | LOW | Add a simple confirmation modal for delete operations. Reuse the existing modal pattern with a "Are you sure?" prompt. |
| Dark mode consistency | CSS variables defined but some components use hardcoded Tailwind gray classes (`border-gray-200`, `bg-gray-100`) instead of CSS variables. Dark mode partially broken. | LOW | Audit all components for hardcoded color values. Replace with CSS variable equivalents (`border-border`, `bg-surface`, etc.). The globals.css already defines the right variables. |

### Differentiators (Competitive Advantage)

Features that make BorrowMate feel polished and thoughtful beyond baseline expectations. Not required for launch but add significant perceived quality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Optimistic UI updates | Lending and returning items currently requires a full server round-trip before the UI updates. Optimistic updates make the app feel instant -- show the change immediately, roll back on failure. | MEDIUM | Apply to: return item, batch lend, create contact. Use React 19 `useOptimistic` hook. Only worth doing for the 3-4 most common actions. |
| Keyboard shortcuts for power users | Quick access to common flows: `Cmd+L` to lend, `Cmd+K` for command palette / search, `Escape` to close modals. Linear/Notion apps train users to expect keyboard navigation. | MEDIUM | Add a lightweight command palette (search contacts, items, navigate). Keyboard shortcut handler in a client component. Defer to v1.x if scope is tight. |
| Animated transitions and microinteractions | Subtle animations on page transitions, modal open/close, item status changes. Makes the app feel responsive and alive without being distracting. | LOW | CSS transitions on modals (fade + scale), list item enter/exit animations. Keep it simple: `transition-all duration-200` is usually enough. No animation library needed. |
| Smart error recovery | When batch lending partially fails, show which items succeeded and which failed, with retry option for failures. Currently returns a single error message. | LOW | The `batchLendToContact` action already tracks per-item results. Surface this in the UI: green checkmarks for success, red X for failures, retry button. |
| Activity timeline on contact detail | Visual history of all lending/returning activity with a contact. Currently shows a flat list -- a timeline view with dates and status changes tells a better story. | LOW | Transform the existing `getContactWithBorrowHistory` data into a timeline UI. Just CSS/layout change, no new data fetching needed. |

### Anti-Features (Do NOT Build in This Milestone)

Features that seem appealing but would derail the security/polish focus of this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full testing framework setup | "You need tests before production" | Correct long-term, but this milestone is about hardening what exists. Setting up testing infrastructure (Jest/Vitest + React Testing Library + Playwright) is a separate project. Input validation via Zod provides runtime safety now. | Add Zod validation (catches 90% of input bugs). Plan testing as a dedicated future milestone. |
| Rate limiting / bot protection | "Production apps need rate limiting" | Correct, but premature. The app is pre-launch with zero users. Rate limiting adds infrastructure complexity (Redis, middleware logic). Supabase has built-in rate limits on auth endpoints. | Rely on Supabase's built-in auth rate limits. Add application-level rate limiting when user count warrants it. CAPTCHA on signup is worth considering if bot signups become an issue. |
| Centralized logging / error tracking | "You need Sentry or LogRocket" | Adds a third-party dependency and configuration overhead. The current milestone goal is to fix the errors, not observe them better. | Remove console.log spam. Add structured error returns from server actions. Plan observability as a post-launch addition. |
| New features (reminders, QR codes, etc.) | Scope creep from the feature backlog | This milestone is explicitly about hardening and polish, not new capabilities. Every new feature adds surface area that needs security review and UI polish. | Keep the out-of-scope list from PROJECT.md. New features belong in future milestones. |
| Full accessibility (WCAG AA) audit | "Production apps must be accessible" | A complete a11y audit is a significant effort. However, basic accessibility (ARIA attributes on forms, keyboard navigation for modals, focus management) should be included as part of form validation and component design work. | Include basic ARIA attributes in form validation work. Add focus trapping to modals. Defer comprehensive a11y audit to a future milestone but do not regress. |
| Component library migration (shadcn/ui, Radix) | "Use a proper component library" | Introducing a component library mid-project requires rewriting every component. The existing CSS utility approach (globals.css + Tailwind) works. The issue is inconsistency, not tooling. | Standardize the existing pattern: create 6-8 reusable components using current Tailwind approach. If a component library is desired, plan it as a fresh milestone. |

## Feature Dependencies

```
[Zod Input Validation]
    |--- required-by ---> [Form Validation with Inline Errors]
    |                         (client and server share Zod schemas)
    |--- required-by ---> [UUID Parameter Validation]
    |                         (Zod provides z.string().uuid())
    |--- enhances -------> [Toast Notifications]
                              (structured errors from Zod enable specific toast messages)

[Middleware Route Protection Fix]
    |--- required-by ---> [All other security features]
    |                         (if routes aren't protected, nothing else matters)

[Authorization Checks on Mutations]
    |--- required-by ---> [RLS Policy Audit]
    |                         (server-side auth is the first layer; RLS is defense-in-depth)

[Component Design System]
    |--- required-by ---> [Empty States]
    |                         (empty states use Button, Card components)
    |--- required-by ---> [Loading States / Skeletons]
    |                         (skeletons mirror component shapes)
    |--- required-by ---> [Confirmation Dialogs]
    |                         (dialogs use Modal, Button components)
    |--- required-by ---> [Dark Mode Consistency]
    |                         (components use CSS variables consistently)

[Toast Notification System]
    |--- enhances -------> [Optimistic UI Updates]
    |                         (toasts provide fallback feedback on rollback)

[Form Validation with Inline Errors]
    |--- enhances -------> [Confirmation Dialogs]
    |                         (shared validation + feedback patterns)
```

### Dependency Notes

- **Zod validation is foundational:** Install Zod first. Server action validation, client form validation, and UUID checks all depend on it. One package, used everywhere.
- **Middleware fix is day-one:** The broken middleware means unauthenticated users can access protected routes. Fix this before anything else.
- **Component design system enables UI features:** Empty states, loading states, confirmation dialogs, and dark mode fixes all build on consistent base components. Define components first, then build features with them.
- **Toast system is standalone but enhances everything:** Can be added at any point. Every other feature benefits from user feedback via toasts.

## MVP Definition (This Milestone)

### Launch With (v1 -- Security + Core UX)

Must-complete for production readiness:

- [ ] **Fix middleware route protection** -- the most critical bug, one-line fix
- [ ] **Zod input validation on all server actions** -- prevents arbitrary payload attacks
- [ ] **Authorization checks on all mutations** -- prevents unauthorized operations
- [ ] **UUID parameter validation** -- prevents malformed input from reaching DB
- [ ] **RLS policy audit** -- especially the `users` table exposing all emails
- [ ] **Remove sensitive console.log statements** -- no PII in production logs
- [ ] **Security headers in next.config.js** -- standard OWASP headers
- [ ] **Toast notification system** -- users must know if actions succeed/fail
- [ ] **Empty states for all list views** -- first-time users need guidance
- [ ] **Form validation with inline errors** -- prevent bad data at the source
- [ ] **Confirmation dialogs for destructive actions** -- prevent accidental deletion
- [ ] **Dark mode consistency pass** -- replace all hardcoded grays with CSS variables

### Add After Validation (v1.x)

Features to add once core security and UX are solid:

- [ ] **Component design system** -- extract 6-8 reusable components from existing code
- [ ] **Loading states / skeleton screens** -- add `loading.tsx` files and Suspense
- [ ] **Responsive mobile polish** -- verify all flows work on small screens
- [ ] **Animated transitions** -- subtle fade/scale on modals and page transitions
- [ ] **Optimistic UI updates** -- for return item and batch lend flows

### Future Consideration (v2+)

Features to defer until post-launch:

- [ ] **Keyboard shortcuts / command palette** -- power user feature, not launch-critical
- [ ] **Activity timeline UI** -- visual enhancement, data already available
- [ ] **Smart error recovery with retry** -- nice polish, not blocking
- [ ] **Full testing framework** -- plan as dedicated milestone
- [ ] **Centralized logging / error tracking** -- add when monitoring matters
- [ ] **Rate limiting** -- add when traffic warrants it

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fix middleware route protection | HIGH | LOW | **P1** |
| Zod input validation | HIGH | MEDIUM | **P1** |
| Authorization checks on mutations | HIGH | MEDIUM | **P1** |
| Toast notification system | HIGH | LOW | **P1** |
| Empty states | HIGH | LOW | **P1** |
| Form validation with inline errors | HIGH | MEDIUM | **P1** |
| Confirmation dialogs | MEDIUM | LOW | **P1** |
| Dark mode consistency | MEDIUM | LOW | **P1** |
| Security headers | MEDIUM | LOW | **P1** |
| UUID parameter validation | MEDIUM | LOW | **P1** |
| RLS policy audit | HIGH | MEDIUM | **P1** |
| Remove console.log spam | LOW | LOW | **P1** |
| Environment variable audit | LOW | LOW | **P1** |
| Component design system | MEDIUM | MEDIUM | **P2** |
| Loading states / skeletons | MEDIUM | MEDIUM | **P2** |
| Responsive mobile polish | MEDIUM | MEDIUM | **P2** |
| Animated transitions | LOW | LOW | **P2** |
| Optimistic UI updates | MEDIUM | MEDIUM | **P2** |
| Keyboard shortcuts | LOW | MEDIUM | **P3** |
| Activity timeline | LOW | LOW | **P3** |
| Smart error recovery | LOW | LOW | **P3** |

**Priority key:**
- P1: Must have before public signups
- P2: Should have, add immediately after P1 is complete
- P3: Nice to have, future consideration

## Codebase-Specific Security Findings

These are concrete vulnerabilities found during code review, not theoretical concerns:

| File | Issue | Severity | Fix |
|------|-------|----------|-----|
| `utils/supabase/middleware.ts` L49-56 | Route protection condition is always false (`!pathname.startsWith('/')` -- all paths start with `/`). No routes are actually protected. | **CRITICAL** | Rewrite condition to explicitly check against protected route prefixes. |
| `app/borrow/actions.ts` `returnItem()` | No authentication check. No ownership verification. Anyone who knows a record ID can mark items as returned. | **HIGH** | Add auth check and verify user is the lender. |
| `app/borrow/actions.ts` `borrowItem()` | Does not verify caller is authorized to borrow from this group. Relies entirely on RLS. | **HIGH** | Add explicit group membership check. |
| `app/items/actions.ts` `createItem()` L39 | Logs full item creation data including user ID to console. | **MEDIUM** | Remove console.log. |
| `app/groups/actions.ts` `searchUsers()` | Passes user query directly into `.or()` filter: `name.ilike.%${query}%`. Potential for query manipulation. | **MEDIUM** | Sanitize query input or use parameterized approach. Supabase client should handle this, but validate input length and character set. |
| `supabase/migrations/20240101000000_init.sql` L18-20 | `users` table SELECT policy is `using (true)` -- every authenticated user can see all other users' names, emails, and phone numbers. | **MEDIUM** | Restrict to: own profile always visible, other users only when in shared group or linked as contact. |
| `app/items/actions.ts` `getGroupItems()` | No auth check. Relies entirely on RLS. If RLS policy is misconfigured, leaks group items. | **LOW** | Add explicit auth check as defense-in-depth. |
| `app/auth/actions.ts` `signInWithGoogle()` | Error is commented out (`// return { error: error.message }`). OAuth errors are silently swallowed. | **LOW** | Uncomment error handling or add proper error return. |

## Sources

### Official Documentation (HIGH confidence)
- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) -- Data Access Layer patterns, server action security, tainting
- [Next.js Security Blog Post](https://nextjs.org/blog/security-nextjs-server-components-actions) -- Server Components and Actions security model
- [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod) -- RLS, network restrictions, MFA, SMTP
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Policy patterns and best practices
- [Next.js Content Security Policy Guide](https://nextjs.org/docs/pages/guides/content-security-policy) -- CSP header configuration

### Verified Third-Party Sources (MEDIUM confidence)
- [MakerKit: Next.js Server Action Security](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions) -- 5 common vulnerabilities
- [TurboStarter: Complete Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- [Arcjet: Next.js Server Action Security](https://blog.arcjet.com/next-js-server-action-security/) -- Public endpoint risks
- [SupaExplorer: Supabase Security Best Practices 2026](https://supaexplorer.com/guides/supabase-security-best-practices) -- RLS audit patterns
- [next-safe-action](https://next-safe-action.dev/) -- Type-safe server action library (alternative to manual Zod validation)

### UX Research Sources (MEDIUM confidence)
- [LogRocket: Linear Design Trend](https://blog.logrocket.com/ux-design/linear-design/) -- Minimal SaaS design patterns
- [Smashing Magazine: Accessible Form Validation](https://www.smashingmagazine.com/2023/02/guide-accessible-form-validation/) -- ARIA patterns
- [Eleken: Empty State UX](https://www.eleken.co/blog-posts/empty-state-ux) -- Empty state design best practices
- [Mobbin: Skeleton UI Design](https://mobbin.com/glossary/skeleton) -- Loading state patterns
- [Pencil & Paper: Error Feedback UX](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback) -- Error message patterns

### Codebase Audit (HIGH confidence)
- Direct review of all 7 server action files, middleware, RLS policies in init migration, and globals.css
- Specific line-level vulnerability findings documented in "Codebase-Specific Security Findings" table above

---
*Feature research for: BorrowMate security hardening & UX refinement*
*Researched: 2026-02-22*
