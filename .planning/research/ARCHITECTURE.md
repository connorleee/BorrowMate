# Architecture Patterns: Security Hardening & Design System

**Domain:** Contact-centric item lending web app (security + UX refinement layer)
**Researched:** 2026-02-22

## Current Architecture Overview

BorrowMate runs on Next.js 16 App Router with Supabase (PostgreSQL + RLS + Auth) and Tailwind CSS v4. The existing architecture follows a standard pattern:

```
Browser
  |
  v
Next.js Middleware (session refresh only)
  |
  v
App Router (Server Components = data fetching, Client Components = interactivity)
  |
  v
Server Actions (mutations, organized by domain: items, borrow, contacts, groups, auth, users, notifications)
  |
  v
Supabase Client (@supabase/ssr)
  |
  v
Supabase PostgreSQL (RLS policies on all tables)
```

The security and design system layers integrate into this existing architecture at specific injection points -- they do NOT replace or restructure it.

---

## Recommended Architecture: Security Layers

Security hardening applies at four distinct layers. Each layer has a specific responsibility and should be built in dependency order.

### Layer 1: Input Validation (Server Actions)

**Where:** Every `actions.ts` file across all domain modules
**What:** Zod schema validation on all user input before any database operation
**Confidence:** HIGH (Next.js official docs + community consensus)

The current codebase uses raw `FormData.get() as string` casts with no runtime validation. This is the single highest-priority security fix.

**Pattern: Validated Server Action**
```typescript
'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Schema defined co-located with action
const createItemSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  category: z.string().max(100).trim().optional(),
  privacy: z.enum(['private', 'public']),
  groupId: z.string().uuid().nullable().optional(),
})

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Validate input
  const parsed = createItemSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    privacy: formData.get('privacy'),
    groupId: formData.get('groupId') || null,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('items')
    .insert({ ...parsed.data, owner_user_id: user.id })
    .select()

  if (error) return { error: error.message }
  revalidatePath('/items')
  return { success: true }
}
```

**Why Zod (not alternatives):** Zod is the de facto standard for TypeScript schema validation. It has first-class support in next-safe-action, react-hook-form, and the broader Next.js ecosystem. Valibot is lighter but has smaller ecosystem. Use Zod because the ecosystem integration matters more than bundle size for server-side validation.

**Alternative considered: next-safe-action.** This library (v8) wraps server actions with composable middleware for auth/validation/logging. It is excellent for greenfield projects, but for BorrowMate's existing 7 action files with ~25+ exported functions, adopting it would mean rewriting every action signature and every call site. The simpler approach -- adding Zod validation directly inside existing actions -- achieves the same security outcome with far less disruption. Revisit next-safe-action if the action count grows significantly or if you need composable middleware patterns later.

### Layer 2: Authentication Hardening (Middleware + Server Actions)

**Where:** `middleware.ts` and `utils/supabase/middleware.ts`
**What:** Fix the broken route protection logic and add security headers
**Confidence:** HIGH (direct code inspection reveals the bug)

The current middleware has a logic bug. The condition chain:
```typescript
if (!user && !request.nextUrl.pathname.startsWith('/auth')
    && !request.nextUrl.pathname.startsWith('/')  // <-- THIS MATCHES EVERYTHING
    && request.nextUrl.pathname !== '/')
```
The `!request.nextUrl.pathname.startsWith('/')` condition is always false (every path starts with `/`), which means the redirect to `/auth` NEVER fires. Every route is currently unprotected at the middleware level. Authentication only works because individual server actions check `getUser()`.

**Fix pattern:**
```typescript
export async function updateSession(request: NextRequest) {
  // ... supabase client setup ...

  const { data: { user } } = await supabase.auth.getUser()

  // Define public routes explicitly
  const publicRoutes = ['/', '/auth', '/auth/callback', '/about']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith('/auth/')
  )

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // Add security headers
  const response = supabaseResponse
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}
```

**Important context -- CVE-2025-29927:** A critical vulnerability in Next.js (CVSS 9.1) allowed complete bypass of middleware via the `x-middleware-subrequest` header. This affects versions up to 15.2.2. BorrowMate is on Next.js 16.1.1, which is patched. However, this CVE reinforces that middleware should NEVER be the sole authentication layer. Every server action must also verify auth independently (which BorrowMate already does). This is defense-in-depth.

### Layer 3: Authorization Audit (RLS Policies + Server Actions)

**Where:** Supabase migrations (RLS policies) and server action authorization checks
**What:** Systematic audit of every RLS policy for correctness and every server action for proper ownership verification
**Confidence:** HIGH (direct code and migration inspection)

**Known issues found in current codebase:**

1. **Users table is world-readable.** The `users` table has `USING (true)` for SELECT, meaning any authenticated user can read every user's profile including email. This is likely intentional for discoverability but should be verified as desired behavior.

2. **Items delete policy missing.** The init migration defines SELECT, INSERT, and UPDATE policies for items but no DELETE policy. The `deleteItem` server action works by filtering on `owner_user_id`, but RLS would silently fail the delete for non-owners rather than enforcing it at the DB level.

3. **Borrow records lack contact-based access.** Original RLS policies are group-based. Contact-centric lending (where `group_id` is null) relies on later migrations that may have gaps. Needs systematic review.

4. **37 migrations with incremental RLS fixes.** Multiple migrations fix "recursion" issues in RLS policies, suggesting the policies have been patched reactively. A consolidated audit should verify the final effective policy state.

**Audit approach:**
```sql
-- Run against local Supabase to see all active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

**Use Supabase Security Advisor (Splinter)** to scan for common misconfigurations. Available in the Supabase Dashboard under Database > Advisors. It checks for: tables without RLS, auth.users exposed, policies referencing user_metadata, and more.

### Layer 4: Security Headers & CSP (Next.js Config + Middleware)

**Where:** `next.config.ts` and middleware
**What:** Content Security Policy, security headers
**Confidence:** MEDIUM (standard practice, but CSP tuning requires iteration)

```typescript
// next.config.ts
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
}
```

CSP should be added later -- it requires careful tuning to not break Supabase auth redirects and inline styles from Tailwind.

---

## Recommended Architecture: Design System

The design system layers on top of the existing component structure. It does NOT require a UI library like shadcn/ui -- the existing CSS utility classes in `globals.css` plus Tailwind v4's `@theme` directive provide the foundation. The goal is consistency, not new dependencies.

### Component Hierarchy

```
Design Tokens (globals.css @theme + CSS variables)
  |
  v
Primitive Components (Button, Input, Badge, Modal shell)
  |
  v
Composite Components (Card variants, Form groups, Search bars)
  |
  v
Feature Components (BatchLendModal, ItemCard, ContactCard -- already exist)
  |
  v
Page Compositions (dashboard, items, contacts pages)
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Design Tokens** (`globals.css`) | Color palette, spacing scale, typography, shadows via CSS variables + `@theme` | All components consume tokens |
| **Button** (new primitive) | All button variants: primary, secondary, danger, ghost, sizes, loading state | Used by every interactive component |
| **Input** (new primitive) | Text input, select, textarea with consistent styling, error states, labels | Used by all form-containing components |
| **Badge** (new primitive) | Status indicators: success, error, warning, info, neutral | Used by cards, lists |
| **Modal** (new primitive) | Portal-based modal shell with overlay, animation, close behavior | Wraps BatchLendModal, ItemDetailModal, AddContactModal, etc. |
| **Card** (existing, refine) | Already exists as base + variants. Needs dark mode CSS variable alignment | Contains feature-specific content |
| **Feature Components** (existing) | BatchLendModal, ContactCard, etc. Refactor to use primitives | Compose primitives, call server actions |

### Data Flow (Design System)

Design tokens flow downward through CSS custom properties -- no prop drilling needed:

```
globals.css (@theme + :root / [data-theme="dark"])
  |
  v
Tailwind utility classes reference tokens (e.g., bg-base, text-text-primary)
  |
  v
Primitive components use tokens via Tailwind classes
  |
  v
Feature components compose primitives (never raw Tailwind for core patterns)
```

**Key rule:** Feature components should use primitive components for buttons, inputs, badges, and modals. They should NOT duplicate styling inline. The current `batch-lend-modal.tsx` has 15+ instances of raw `border-gray-300`, `bg-white`, `text-gray-500` etc. that should use CSS variables or primitives instead.

### Design Token Architecture

The current `globals.css` already defines a good token system. Extend it, do not replace it:

**Existing tokens (keep):**
- `--bg-base`, `--bg-surface`, `--bg-elevated`
- `--text-primary`, `--text-secondary`, `--text-tertiary`
- `--border`, `--shadow-sm/md/lg`

**Missing tokens to add:**
```css
:root {
  /* Interactive states */
  --bg-interactive: var(--color-primary-50);
  --bg-interactive-hover: var(--color-primary-100);
  --border-interactive: var(--color-primary-300);

  /* Focus ring */
  --ring-color: var(--color-primary-500);
  --ring-offset: 2px;

  /* Border radius scale */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

[data-theme="dark"] {
  --bg-interactive: rgba(168, 85, 247, 0.1);
  --bg-interactive-hover: rgba(168, 85, 247, 0.2);
  --border-interactive: var(--color-primary-500);
}
```

### Where shadcn/ui Fits (and Where It Does Not)

**Do NOT adopt shadcn/ui for this milestone.** Reasons:

1. BorrowMate already has 29 components with established patterns. Migrating to shadcn/ui would mean rewriting the entire component tree.
2. shadcn/ui brings Radix UI primitives as dependencies. The app currently has zero component library dependencies. Adding Radix adds complexity without proportional value for this app's modest UI needs.
3. The existing CSS utility classes (`.btn-primary`, `.card`, `.input-field`, `.modal-overlay`) are the right abstraction level. They need refinement and consistent adoption, not replacement.
4. shadcn/ui's Tailwind v4 support is available but still maturing. Adding it to an existing v4 project requires careful migration of the animation system (`tw-animate-css`).

**When to reconsider:** If BorrowMate grows to need complex UI primitives (combobox, dropdown menus, date pickers, command palette), shadcn/ui becomes worth the investment. Not now.

---

## Patterns to Follow

### Pattern 1: Validated Server Action with Auth Guard

**What:** Every server action validates input with Zod, checks auth, verifies authorization
**When:** Every mutation and sensitive query
**Example:**
```typescript
'use server'

import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'

const schema = z.object({
  contactId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(1).max(50),
  dueDate: z.string().datetime().optional(),
})

export async function batchLendToContact(
  itemIds: string[],
  contactId: string,
  dueDate?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const parsed = schema.safeParse({ contactId, itemIds, dueDate })
  if (!parsed.success) return { error: 'Invalid input' }

  // Authorization: verify contact ownership
  const { data: contact } = await supabase
    .from('contacts')
    .select('owner_user_id')
    .eq('id', parsed.data.contactId)
    .single()

  if (!contact || contact.owner_user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  // ... proceed with validated, authorized operation
}
```

### Pattern 2: Primitive Component with Variants

**What:** React component using CSS variables, supporting variants via props
**When:** Any UI element used in 3+ places
**Example:**
```typescript
'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

const variantStyles = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
  secondary: 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)]',
  danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  ghost: 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg
        transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  )
}
```

### Pattern 3: Modal Shell with Portal

**What:** Reusable modal shell that handles overlay, animation, escape key, focus trap
**When:** Every modal in the app (currently 6+ modal components duplicating this logic)
**Example:**
```typescript
'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            {/* Close icon */}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
        {footer && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface)] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Colors in Components

**What:** Using `bg-white`, `text-gray-500`, `border-gray-300` directly in components instead of CSS variables
**Why bad:** Breaks dark mode. The current `batch-lend-modal.tsx` has `bg-white` hardcoded on the modal container, making it bright white in dark mode. Found in 15+ places across the component.
**Instead:** Use `bg-[var(--bg-base)]`, `text-[var(--text-secondary)]`, `border-[var(--border)]` or the existing utility classes (`.card`, `.input-field`, `.modal-content`).

### Anti-Pattern 2: Duplicated Modal Boilerplate

**What:** Each modal component independently implements portal rendering, escape handling, overlay click, body scroll lock
**Why bad:** 6+ modal components each have their own version of this logic, with subtle differences (some handle escape, some don't; some lock body scroll, some don't). Bug fixes must be replicated across all.
**Instead:** Extract a `Modal` shell component. Existing modals become content passed as children.

### Anti-Pattern 3: Raw FormData Casts as Security

**What:** `formData.get('name') as string` without validation
**Why bad:** No type safety at runtime. Allows empty strings, arbitrary length strings, SQL injection attempts (RLS catches some, but not application-level logic bugs), and type confusion (passing an object where a string is expected).
**Instead:** Always parse through Zod schema before use. The schema IS the documentation of what the action accepts.

### Anti-Pattern 4: Console.log for Error Reporting

**What:** `console.error('Error creating item:', error)` scattered through server actions
**Why bad:** Logs are lost in production. No alerting, no structured data, no correlation between related errors.
**Instead:** For this milestone, standardize a simple error logging utility that wraps console.error with consistent formatting. Full observability (Sentry, etc.) can come later.

### Anti-Pattern 5: Trusting Client for Authorization

**What:** Checking ownership in server actions but not always verifying the authenticated user owns the resource before operating on it
**Why bad:** Some actions (like `returnItem`) accept a `recordId` and `itemId` without verifying the authenticated user is the lender. RLS policies are the safety net, but defense-in-depth requires server action checks too.
**Instead:** Every mutation action must verify: (1) user is authenticated, (2) input is valid, (3) user is authorized to perform this specific action on this specific resource.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **RLS performance** | No impact | Index all columns in RLS policies (already partially done) | Consider RLS policy simplification, materialized views |
| **Input validation** | Zod in-process, negligible | Same | Same -- Zod is fast |
| **Design system** | CSS variables, zero runtime cost | Same | Same |
| **Auth checks** | `getUser()` per action, ~1ms | Same | Consider caching user session per request with React `cache()` |
| **Error logging** | Console sufficient | Need structured logging (JSON) | Need centralized logging (Sentry, Axiom) |

---

## Build Order (Dependency Graph)

The security and design system work can be interleaved, but within each track there are dependencies:

```
SECURITY TRACK                          DESIGN SYSTEM TRACK
==============                          ===================

1. Fix middleware auth bug              1. Extend design tokens in globals.css
   (unblocks all route protection)         (foundation for all components)
         |                                        |
         v                                        v
2. Add Zod + validation schemas         2. Build primitive components
   (unblocks validated actions)            (Button, Input, Badge, Modal shell)
         |                                        |
         v                                        v
3. Audit & fix RLS policies             3. Refactor existing components
   (requires understanding current          to use primitives
   effective policies)                     (BatchLendModal, forms, etc.)
         |                                        |
         v                                        v
4. Add authorization checks             4. Fix hardcoded colors -> CSS vars
   to all server actions                    (dark mode consistency pass)
         |                                        |
         v                                        v
5. Security headers + CSP               5. Visual polish pass
   (final layer, least urgent)              (spacing, typography, layout)
```

**Cross-track dependencies:**
- Security items 1-2 and Design items 1-2 are fully independent -- can run in parallel
- Security item 3 (RLS audit) blocks nothing on the design track
- Design item 3 (refactoring components) is a good time to also fix hardcoded auth patterns in client components
- Security item 5 (CSP) should come AFTER design is finalized, since CSP rules depend on what assets and styles the app uses

**Recommended interleaving:**
1. Middleware fix + Design tokens (parallel, quick wins)
2. Zod validation + Primitive components (parallel, foundational)
3. RLS audit (security-focused sprint)
4. Component refactoring + Action authorization audit (parallel, touches same files)
5. Dark mode pass + Security headers (parallel, polish)

---

## Sources

- [Next.js Data Security Guide](https://nextjs.org/docs/app/guides/data-security) -- Official Next.js documentation on Data Access Layer pattern, server action security, tainting, CSRF protection (HIGH confidence)
- [Next.js Security Blog: CVE-2025-29927](https://nextjs.org/blog/security-nextjs-server-components-actions) -- Official security advisory confirming middleware bypass vulnerability (HIGH confidence)
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) -- Official RLS documentation and best practices (HIGH confidence)
- [Supabase Database Advisors (Splinter)](https://supabase.com/docs/guides/database/database-advisors) -- Official security and performance scanning tool (HIGH confidence)
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) -- Index columns in RLS policies (HIGH confidence)
- [next-safe-action](https://next-safe-action.dev/) -- Type-safe server action library with middleware, v8 (MEDIUM confidence -- verified via official site, but recommendation is to defer adoption)
- [MakerKit: Secure Next.js Server Actions](https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions) -- 5 common vulnerabilities in server actions (MEDIUM confidence)
- [shadcn/ui Tailwind v4 Support](https://ui.shadcn.com/docs/tailwind-v4) -- Official shadcn/ui docs on v4 compatibility (HIGH confidence -- verified via official site, but recommendation is to defer adoption)
- [Tailwind CSS v4 Design System Patterns](https://www.frontendtools.tech/blog/tailwind-css-best-practices-design-system-patterns) -- Design token and component library patterns (LOW confidence -- single source, community blog)
- [Supabase Security Retro 2025](https://supaexplorer.com/dev-notes/supabase-security-2025-whats-new-and-how-to-stay-secure.html) -- Security tooling roadmap (LOW confidence -- third-party source)
