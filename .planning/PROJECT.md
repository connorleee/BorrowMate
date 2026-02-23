# BorrowMate

## What This Is

A contact-centric item lending app for friend groups who lose track of who borrowed what. Users manage personal inventory, lend items to contacts, and track active loans — all in a streamlined 3-5 tap flow. Built with Next.js 16, React 19, Supabase, and Tailwind CSS v4.

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
- ✓ Middleware protects authenticated routes — existing
- ✓ RLS enabled on all database tables — existing

### Active

- [ ] Full security audit — RLS policies, auth hardening, input validation, injection prevention
- [ ] Component design system — consistent buttons, cards, forms, modals across all pages
- [ ] Visual design overhaul — clean minimal aesthetic (Linear/Notion style), consistent spacing and typography
- [ ] Lending flow refinement — reduce friction, simplify steps
- [ ] Navigation improvements — clear information architecture, easy to find things
- [ ] Dark mode consistency — fix any remaining dark mode issues with unified CSS variables

### Out of Scope

- Mobile native app — web-first, responsive design only
- Real-time chat — not core to lending value
- Video/image uploads for items — keep it simple, text-based catalog
- Notifications system overhaul — existing notification structure sufficient for now
- New feature development — this milestone is about hardening and polish, not new capabilities

## Context

- Solo developer, only user currently — building toward production-ready state
- Existing codebase has ~37 SQL migrations, server actions organized by domain
- UI was built quickly in a first pass — components are functional but inconsistent
- Buttons, cards, forms, and modals all have slightly different styling across pages
- No testing framework configured yet
- No schema validation library (server actions use raw FormData casts)
- Console-based error logging only, no centralized logging

## Constraints

- **Tech stack**: Must stay on Next.js 16 + Supabase + Tailwind CSS v4 — no framework changes
- **Database**: No breaking schema changes — existing data must be preserved
- **Goal**: Production-ready for public signups after this milestone

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean minimal design direction (Linear/Notion) | User preference for professional, whitespace-heavy aesthetic | — Pending |
| Security before or alongside UX | Both equal priority — interleave as makes sense | — Pending |
| Component-first approach to UI consistency | Fix components once, consistency follows everywhere | — Pending |

---
*Last updated: 2026-02-22 after initialization*
