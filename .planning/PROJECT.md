# BorrowMate

## What This Is

A contact-centric item lending app for friend groups who lose track of who borrowed what. Users manage personal inventory, lend items to contacts, and track active loans — all in a streamlined 3-5 tap flow. Built with Next.js 16, React 19, Supabase, and Tailwind CSS v4. Production-hardened with input validation, RLS policies, and a consistent design system.

## Core Value

Users can quickly lend items to contacts and always know who has what — lending must be fast, tracking must be reliable.

## Requirements

### Validated

- ✓ User can sign up with email/password and Google OAuth — existing
- ✓ User session persists across browser refresh via Supabase SSR cookies — existing
- ✓ User can create, view, and delete inventory items — existing
- ✓ User can create and manage lending contacts — existing
- ✓ User can batch-lend multiple items to a single contact — existing
- ✓ User can mark borrowed items as returned — existing
- ✓ Dashboard shows active loans grouped by contact — existing
- ✓ User can create and join groups for shared inventory — existing
- ✓ User can follow other users — existing
- ✓ Dark mode / light mode toggle — existing
- ✓ Middleware protects authenticated routes — v1.0
- ✓ RLS policies audited and tightened across all tables — v1.0
- ✓ All 27 mutation server actions validated with Zod schemas — v1.0
- ✓ Design system primitives (Button, Input, Card, Badge, Modal) with CVA variants — v1.0
- ✓ All components migrated to CSS variable classes and design system primitives — v1.0
- ✓ Dark mode consistent across all pages — v1.0
- ✓ Toast notifications on all mutations — v1.0
- ✓ Empty states on all list views — v1.0
- ✓ Skeleton loading on all data pages — v1.0
- ✓ Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) — v1.0
- ✓ Users table PII protected via owner-only RLS + user_profiles view — v1.0

### Active

- [ ] Rate limiting for auth endpoints and mutations
- [ ] Confirmation dialogs for destructive actions (delete item, remove contact)
- [ ] Keyboard navigation and WCAG accessibility audit
- [ ] Lending flow refinement — reduce friction, simplify steps
- [ ] Navigation improvements — clear information architecture

### Out of Scope

- Mobile native app — web-first, responsive design only
- Real-time chat — not core to lending value
- Video/image uploads for items — keep it simple, text-based catalog
- Third-party UI library (shadcn/ui) — existing CVA-based primitives are solid

## Context

- Solo developer, only user currently — production-ready for public signups
- Codebase: 9,558 LOC TypeScript, ~38 SQL migrations
- Server actions organized by domain with Zod validation via next-safe-action
- Design system: 5 CVA-based primitives, CSS variable theming, dark mode throughout
- All RLS policies documented in RLS-AUDIT.md
- No testing framework configured yet
- No centralized logging (errors propagated via return values)

## Constraints

- **Tech stack**: Must stay on Next.js 16 + Supabase + Tailwind CSS v4 — no framework changes
- **Database**: No breaking schema changes — existing data must be preserved
- **Design system**: Use existing CVA primitives and CSS variable system for new components

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean minimal design direction (Linear/Notion) | User preference for professional, whitespace-heavy aesthetic | ✓ Good — consistent design system shipped |
| Security before or alongside UX | Both equal priority — interleaved Phases 1/2/4 (security) with 3/5 (UI) | ✓ Good — independent tracks worked well |
| Component-first approach to UI consistency | Fix components once, consistency follows everywhere | ✓ Good — 5 primitives, then mechanical migration |
| Zod v4 + next-safe-action v8 | Latest versions, Standard Schema compatible | ✓ Good — clean migration, no issues |
| user_profiles view over SECURITY DEFINER | Simpler, standard SQL for cross-user lookups | ✓ Good — worked cleanly across all queries |
| Static CSP with unsafe-inline | Avoids forcing dynamic rendering on all pages | ✓ Good — practical tradeoff for Next.js SSG |
| CVA-based primitives (no shadcn/ui) | Existing CSS variable system is solid, lighter weight | ✓ Good — full codebase migrated successfully |
| Toast system via React Context + portal | Lightweight, no dependency, app-wide availability | ✓ Good — clean integration with all mutations |

---
*Last updated: 2026-02-24 after v1.0 milestone*
