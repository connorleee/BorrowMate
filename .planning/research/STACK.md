# Technology Stack: Security Hardening & Design System

**Project:** BorrowMate - Security Audit & UX Refinement Milestone
**Researched:** 2026-02-22
**Existing Stack:** Next.js 16, React 19, TypeScript 5, Supabase, Tailwind CSS v4, @supabase/ssr

---

## Recommended Additions

### Security: Input Validation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zod | ^4.3.6 | Schema validation for all server action inputs | Industry standard for TypeScript-first validation. Zod 4 is 6-14x faster than Zod 3, 57% smaller bundle (5.36kb gzip), and has native `z.toJSONSchema()`. Every server action currently uses raw `formData.get() as string` casts with zero validation -- this is the single biggest security gap. | HIGH |

**Rationale:** The codebase has 8 server action files. Every mutation (`createItem`, `borrowItem`, `createContact`, `batchLendToContact`, etc.) blindly casts FormData to strings and passes them directly to Supabase. Zod schemas at the top of each action provide:
1. Type coercion (string to number, date parsing)
2. Constraint enforcement (max lengths, email format, UUID format)
3. Early rejection of malformed input before it hits the database
4. Self-documenting API contracts

**Why Zod 4 over Zod 3:** Zod 4 dropped July 2025. It is the current major version. Performance improvements are massive (14x faster string parsing), bundle is half the size, and it adds `z.file()` for future file uploads plus better recursive types. No reason to start on Zod 3.

### Security: Server Action Safety Layer

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| next-safe-action | ^8.0.12 | Type-safe server action wrapper with middleware pipeline | Provides composable middleware (auth check, rate limit) that runs before every action, structured error responses (validation errors + server errors + fetch errors), and eliminates boilerplate. Supports Zod 4 via Standard Schema spec. Requires Next.js >= 14, React >= 18.2, TypeScript >= 5 -- all satisfied. | MEDIUM |

**Rationale -- use this, but phase it in gradually:** The codebase has ~15 server actions. Wrapping them all in next-safe-action at once is risky. Instead, create an action client with auth middleware, then migrate actions one file at a time. The middleware pipeline pattern eliminates the repeated `const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: 'Not authenticated' }` block that appears in every single action.

**Why not plain Zod only:** Plain Zod + manual `safeParse()` works fine for validation. But it does not give you the middleware pipeline, structured error typing, or the `useAction` / `useOptimisticAction` hooks. For a solo developer migrating 15+ actions, next-safe-action reduces boilerplate significantly. The tradeoff is one more dependency, but it is lightweight and well-maintained (8.0.12 published Feb 2026).

### Security: Rate Limiting & Bot Protection (Defer to Phase 2)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @arcjet/next | ^1.1.0 | Rate limiting, bot detection, Shield WAF | Server Actions are public HTTP POST endpoints. Without rate limiting, signup, login, and borrow actions can be brute-forced. Arcjet adds rate limiting + bot detection with <1ms local latency. Free tier sufficient for solo/small app. | MEDIUM |

**Rationale -- defer this:** This is important for production but not the first priority. Input validation (Zod) and auth hardening come first. Arcjet should be added after the validation layer is solid. It integrates as middleware in Next.js, protecting both API routes and server actions.

**Why Arcjet over Upstash Rate Limit:** Arcjet bundles rate limiting + bot detection + WAF in one SDK with local decision caching (<1ms). Upstash requires Redis setup and is rate-limiting only. For a solo developer who wants security without infrastructure, Arcjet is simpler.

### Design System: Class Composition

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| tailwind-merge | ^3.5.0 | Intelligent Tailwind class merging without conflicts | When building reusable components that accept className overrides, Tailwind classes conflict (e.g., `p-4` + `p-2` both apply). tailwind-merge resolves this by keeping only the last conflicting class. v3.5.0 supports Tailwind CSS v4. | HIGH |
| clsx | ^2.1.1 | Conditional class name composition | Lightweight (228 bytes) utility for conditional classes: `clsx('base', isActive && 'active', { 'disabled': isDisabled })`. Pairs with tailwind-merge in the `cn()` utility pattern. | HIGH |
| class-variance-authority | ^0.7.1 | Type-safe component variant definitions | Defines component variants (size, color, state) with type safety. The `cva()` function produces a typed function that maps props to class strings. Standard pattern for Tailwind design systems. Used by shadcn/ui and most Tailwind component libraries. | HIGH |

**The `cn()` utility pattern -- create this first:**

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This single function is the foundation of the entire design system. Every component uses `cn()` to merge base classes, variant classes, and consumer overrides without conflicts.

**CVA component pattern -- use for every shared component:**

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500",
        secondary: "bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] focus:ring-primary-500",
        danger: "bg-error-500 text-white hover:bg-error-600 focus:ring-error-500",
        ghost: "text-[var(--text-primary)] hover:bg-[var(--bg-surface)] focus:ring-primary-500",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
```

This replaces the current `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` CSS classes in `globals.css` with type-safe, composable React components.

---

## Existing Stack (No Changes Needed)

| Technology | Current Version | Status | Notes |
|------------|----------------|--------|-------|
| Next.js | ^16.1.1 | Keep | Latest stable. Check for CVE-2025-66478 patch (critical RCE in RSC deserialization). Verify you're on a patched version. |
| React | 19.2.0 | Keep | Latest stable. |
| TypeScript | ^5 | Keep | Satisfies all new library requirements. |
| Tailwind CSS | ^4 | Keep | v4 with CSS-first config is already set up correctly in globals.css. |
| @supabase/ssr | ^0.7.0 | Keep | Handles auth cookies. |
| @supabase/supabase-js | ^2.84.0 | Keep | Latest v2 SDK. |

### Critical: Verify Next.js Patch Level

A critical RCE vulnerability (CVE-2025-66478) was disclosed December 2025 affecting Next.js App Router with React Server Components. Run `npm ls next` to check exact version. If below the patched version, upgrade immediately. This is the highest-priority security action.

---

## Supabase Security (No New Libraries -- Use Built-in Tools)

| Tool | Type | Purpose | Why | Confidence |
|------|------|---------|-----|------------|
| Supabase Security Advisor | Built-in dashboard | Automated RLS policy audit | Uses Splinter (open-source Postgres security linter). Checks for: RLS enabled but no policies, multiple permissive policies, auth users exposed, unindexed foreign keys. Run this before any code changes. | HIGH |
| Supabase Hardening Guide | Documentation | Data API hardening checklist | Covers: disabling unused API endpoints, custom schemas, auto-RLS on new tables, table-level grant restrictions. Follow systematically. | HIGH |
| `supabase db lint` | CLI command | Local RLS linting | Run during development to catch policy issues before deploy. | MEDIUM |

**Key Supabase security actions (no libraries needed):**
1. Run Security Advisor in Supabase dashboard -- review all alerts
2. Audit every RLS policy -- ensure SELECT/INSERT/UPDATE/DELETE are separate and specific
3. Never use `user_metadata` in RLS policies (user-modifiable, security risk)
4. Add indexes on columns used in RLS policies (performance)
5. Ensure `authenticated` role check exists (not just `auth.uid()`)
6. Review `searchContacts` action -- it uses `ilike` with user-provided search term (potential for RLS bypass if policies are weak)

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Validation | Zod 4 | Valibot | Valibot is smaller but Zod has 10x larger ecosystem, better docs, more Next.js examples. For a solo dev, community support matters. |
| Validation | Zod 4 | Yup | Yup is older, slower, less TypeScript-native. Zod is the standard for TypeScript-first projects. |
| Action safety | next-safe-action | zsa (Zod Server Actions) | zsa is newer with less adoption. next-safe-action has broader community, more docs, and supports Standard Schema (not just Zod). |
| Action safety | next-safe-action | Plain Zod safeParse | Works but no middleware pipeline, no structured error types, no useAction hooks. More boilerplate per action. |
| Class merging | tailwind-merge + clsx | twMerge alone | clsx adds conditional class support (`{ active: isActive }`). Together they handle all cases. |
| Component variants | CVA | Tailwind variants (tv) | CVA is more established (0.7.1 stable), used by shadcn/ui. tv is newer with less adoption. |
| Component library | Build own with CVA | shadcn/ui | shadcn/ui would bring Radix UI primitives and many dependencies. BorrowMate has simple UI needs (buttons, cards, modals, badges, inputs). Building with CVA keeps it minimal and custom. If accessibility primitives are needed later, consider Radix individually. |
| Component library | Build own with CVA | daisyUI | daisyUI uses semantic class names which conflict with the existing CSS variable system. It also adds opinions about design that would fight the Linear/Notion aesthetic goal. |
| Rate limiting | Arcjet | Upstash Rate Limit | Upstash requires Redis setup. Arcjet is all-in-one with local caching. Less infrastructure for solo dev. |
| XSS sanitization | Not needed now | DOMPurify / isomorphic-dompurify | BorrowMate does not render user HTML. All user input is plain text rendered via React's auto-escaping. If rich text is added later, use isomorphic-dompurify (v3.0.0). For now, Zod string validation + React auto-escaping is sufficient. |

---

## Installation

```bash
# Security: Input validation and server action safety
npm install zod next-safe-action

# Design system: Class composition utilities
npm install clsx tailwind-merge class-variance-authority

# Dev dependencies: None needed for these libraries
```

**Deferred installation (Phase 2 -- production hardening):**
```bash
npm install @arcjet/next
```

**Total new dependencies:** 5 (immediate) + 1 (deferred)
**Bundle impact:** Zod 4 is 5.36kb gzip, clsx is 228 bytes, tailwind-merge is ~4kb gzip, CVA is ~1kb gzip. next-safe-action is server-only (no client bundle). Total client impact: ~11kb gzip.

---

## What NOT to Use

| Library | Why Not |
|---------|---------|
| **react-hook-form** | The app uses server actions with FormData, not controlled forms. Adding RHF would mean rewriting all forms to controlled components. Zod validation in server actions is simpler and sufficient. |
| **Prisma / Drizzle** | Supabase client SDK with RLS is the data layer. Adding an ORM would bypass RLS policies and create a second data access path. Keep using Supabase client. |
| **NextAuth / Auth.js** | Supabase Auth with @supabase/ssr is already working. Swapping auth providers is high-risk with no benefit. |
| **Styled Components / Emotion** | Tailwind CSS v4 is the styling system. CSS-in-JS adds runtime cost and conflicts with the utility-first approach. |
| **shadcn/ui (full)** | Would bring Radix UI + many primitives. BorrowMate's UI is simple enough to build with CVA + cn(). Cherry-pick patterns from shadcn/ui but don't install the CLI or full dependency tree. |
| **Storybook** | Solo developer, ~30 components. Storybook is overhead. If the team grows, reconsider. For now, build components in-place and visually test in the app. |
| **DOMPurify** | No user-generated HTML rendering. React auto-escapes text content. Only add if rich text editing is introduced. |
| **helmet / csp-header** | Next.js has built-in security headers via `next.config.js`. Use the `headers()` config function instead of a separate package. |

---

## Sources

- Zod 4 release notes: https://zod.dev/v4 (HIGH confidence -- official docs)
- Zod npm: https://www.npmjs.com/package/zod (HIGH -- npm registry, verified v4.3.6)
- next-safe-action: https://next-safe-action.dev/ (HIGH -- official docs, verified v8.0.12)
- next-safe-action getting started: https://next-safe-action.dev/docs/getting-started (HIGH)
- CVA docs: https://cva.style/docs (HIGH -- official docs, verified v0.7.1)
- tailwind-merge npm: https://www.npmjs.com/package/tailwind-merge (HIGH -- verified v3.5.0 with Tailwind v4 support)
- clsx npm: https://www.npmjs.com/package/clsx (HIGH -- verified v2.1.1)
- Next.js security guide: https://nextjs.org/blog/security-nextjs-server-components-actions (HIGH -- official Next.js blog)
- Next.js CVE-2025-66478: https://nextjs.org/blog/CVE-2025-66478 (HIGH -- official security advisory)
- Next.js data security guide: https://nextjs.org/docs/app/guides/data-security (HIGH -- official docs)
- Supabase RLS docs: https://supabase.com/docs/guides/database/postgres/row-level-security (HIGH -- official Supabase docs)
- Supabase hardening guide: https://supabase.com/docs/guides/database/hardening-data-api (HIGH -- official Supabase docs)
- Supabase Security Advisor: https://supabase.com/docs/guides/database/database-advisors (HIGH -- official Supabase docs)
- Arcjet Next.js SDK: https://docs.arcjet.com/reference/nextjs/ (MEDIUM -- official Arcjet docs, not yet tested with this codebase)
- MakerKit server action security: https://makerkit.dev/blog/tutorials/secure-nextjs-server-actions (MEDIUM -- community reference)
- Arcjet server action blog: https://blog.arcjet.com/next-js-server-action-security/ (MEDIUM -- vendor blog, useful patterns)
