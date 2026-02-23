# Research Summary: BorrowMate Security Hardening & UX Refinement

**Domain:** Security audit and UI design system for an existing contact-centric lending web app
**Researched:** 2026-02-22
**Overall confidence:** HIGH

## Executive Summary

BorrowMate is a functional lending app built on Next.js 16, React 19, Supabase, and Tailwind CSS v4. The codebase has working features (item management, contact-centric lending, batch operations, groups, follows) but was built quickly with significant security gaps and UI inconsistency. This milestone is about hardening what exists for production readiness, not building new features.

The security situation is more serious than it appears at first glance. The middleware auth guard has a logic bug that makes it effectively disabled -- every route is accessible without authentication. Server actions across all 8 domain files use raw `formData.get() as string` casts with zero input validation. One critical action (`returnItem`) has no authentication check at all. RLS policies have accumulated across 37 migrations with known circular dependency patches and at least one overly permissive policy (users table SELECT is world-readable). These are not theoretical concerns; they are concrete, verified code-level findings.

The UI situation is less critical but still blocks a production-quality experience. Three different styling approaches coexist: CSS utility classes in globals.css using CSS variables, inline Tailwind with `dark:` prefixes, and hardcoded colors like `bg-white` that break dark mode. There are 37 instances of `bg-white` across 17 files and 136 instances of `dark:bg-gray-*` patterns that should use CSS variables instead. The fix is straightforward: establish a small set of primitive components (Button, Input, Card, Badge, Modal) using CVA + tailwind-merge + clsx, then migrate page by page.

The recommended approach adds 5 lightweight dependencies (Zod 4, next-safe-action, tailwind-merge, clsx, CVA) totaling about 11kb gzip of client bundle. These are well-established, actively maintained libraries that address the exact gaps in the codebase. The security and design system tracks can be interleaved -- they touch different files and have minimal dependencies on each other.

## Key Findings

**Stack:** Add Zod 4 (input validation), next-safe-action (server action middleware), CVA + tailwind-merge + clsx (design system component variants). Total: 5 new dependencies, ~11kb client bundle.

**Architecture:** Security applies at 4 layers (input validation, auth hardening, RLS audit, security headers). Design system applies at 3 levels (tokens, primitive components, feature component migration). Both integrate into the existing architecture -- no restructuring needed.

**Critical pitfall:** The middleware auth guard is effectively disabled due to a logic bug (`!pathname.startsWith('/')` is always false). Combined with the missing auth check in `returnItem()`, unauthenticated users can access protected routes and potentially trigger operations. Fix this first.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Critical Security Fixes** - Fix the three most dangerous issues before anything else
   - Addresses: Middleware auth bug, returnItem auth check, console.log cleanup
   - Avoids: Pitfall 1 (disabled middleware), Pitfall 4 (returnItem no auth), Pitfall 7 (console leaks)
   - Estimated scope: 3-5 files, small changes with high impact

2. **Validation Foundation** - Add Zod schemas and next-safe-action client
   - Addresses: Input validation for all server actions, auth middleware pattern
   - Avoids: Pitfall 2 (zero validation), Pitfall 9 (breaking error contracts during migration)
   - Estimated scope: Create lib/validations/ schemas, create safe-action client, migrate actions incrementally

3. **Design System Foundation** - Create cn() utility, CVA primitives, and design tokens
   - Addresses: Button, Input, Card, Badge, Modal primitive components
   - Avoids: Pitfall 5 (big-bang UI rewrite), Pitfall 11 (tokens not in Tailwind)
   - Estimated scope: 5-8 new component files, globals.css token additions

4. **RLS Security Audit** - Systematic audit and hardening of all RLS policies
   - Addresses: Policy sprawl, users table exposure, missing delete policies
   - Avoids: Pitfall 3 (RLS sprawl), Pitfall 10 (users table exposure)
   - Estimated scope: Create audit document, review 37 migrations, consolidate policies

5. **Component Migration & Dark Mode** - Migrate existing components to use primitives and CSS variables
   - Addresses: Dark mode consistency, UI inconsistency across pages
   - Avoids: Pitfall 6 (hardcoded colors), Pitfall 5 (big-bang rewrite)
   - Estimated scope: 15-20 component files, incremental migration

6. **Production Polish** - Security headers, loading states, empty states, error display
   - Addresses: CSP headers, user feedback, first-time user experience
   - Avoids: Shipping without OWASP headers or user feedback mechanisms
   - Estimated scope: next.config.js, loading.tsx files, EmptyState component

**Phase ordering rationale:**
- Phase 1 first because the middleware bug is a blocker -- it must be fixed before public signups
- Phases 2 and 3 can be interleaved -- they touch different files (actions vs components)
- Phase 4 (RLS audit) benefits from having validation in place first, so policy decisions align with app-layer validation
- Phase 5 depends on Phase 3 (primitives must exist before migrating to them)
- Phase 6 last because headers and polish depend on the final state of the codebase

**Research flags for phases:**
- Phase 2: Standard patterns, well-documented. Unlikely to need deeper research.
- Phase 4: Likely needs deeper research. The 37 migration files must be read in order to understand effective policies. The SECURITY DEFINER functions need individual audit.
- Phase 6: CSP headers need iteration and testing to not break Supabase auth redirects. May need phase-specific research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All library versions verified via npm. Zod 4, next-safe-action 8, tailwind-merge 3.5, clsx 2.1.1, CVA 0.7.1 all confirmed current. |
| Features | HIGH | Feature landscape based on direct codebase audit. Security findings verified line-by-line. |
| Architecture | HIGH | Architecture patterns based on Next.js official docs and Supabase official docs. Integration points verified against existing code. |
| Pitfalls | HIGH | All critical pitfalls verified by direct code inspection. Middleware bug confirmed. returnItem auth gap confirmed. RLS policy sprawl confirmed across 37 migrations. |

## Gaps to Address

- **Exact Next.js patch version needs verification.** CVE-2025-66478 (critical RCE) affects certain versions. Run `npm ls next` to confirm the installed version is patched.
- **RLS effective policy state unknown.** The 37 migrations have not been consolidated into a single audit document. This must be created during Phase 4. The exact set of active policies is not knowable without running the audit SQL query.
- **CSP header values need iteration.** Content Security Policy cannot be fully specified until the final build is tested. Supabase auth redirects and any inline styles from Tailwind may require CSP exceptions.
- **Rate limiting deferred.** Arcjet (@arcjet/next v1.1.0) is recommended but deferred to after the core security and UX work. Should be added before significant user growth.
- **Accessibility not deeply researched.** Basic ARIA attributes should be included in form validation and component work, but a comprehensive WCAG audit was out of scope for this research pass.
