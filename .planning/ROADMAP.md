# Roadmap: BorrowMate Security & UX Refinement

## Overview

This milestone takes BorrowMate from a functional prototype to production-ready. The work splits into two independent tracks -- security hardening (Phases 1, 2, 4) and UI consistency (Phases 3, 5) -- that converge at the end. Critical security fixes go first because the middleware auth guard is effectively disabled. Input validation and RLS audit follow. In parallel, the design system foundation gets built, then all existing components migrate to it with production polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Critical Security Fixes** - Fix disabled middleware auth, missing action auth checks, and console data leaks (completed 2026-02-23)
- [ ] **Phase 2: Input Validation** - Add Zod schemas and next-safe-action to all server action mutations
- [ ] **Phase 3: Design System Foundation** - Create primitive components (Button, Input, Card, Badge, Modal) with design tokens
- [ ] **Phase 4: RLS Audit & Hardening** - Audit all RLS policies, tighten user data exposure, add security headers
- [ ] **Phase 5: UI Migration & Production Polish** - Migrate all components to primitives, fix dark mode, add toast/empty/loading states

## Phase Details

### Phase 1: Critical Security Fixes
**Goal**: Unauthenticated users cannot access protected routes or trigger mutations
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. Visiting any authenticated route while logged out redirects to the auth page
  2. Calling returnItem() without a valid session returns an auth error and does not modify data
  3. No sensitive user data (emails, IDs, tokens) appears in browser console during normal app usage
**Plans:** 2/2 plans complete

Plans:
- [ ] 01-01-PLAN.md -- Fix middleware auth guard and returnItem auth check
- [ ] 01-02-PLAN.md -- Audit and remove all sensitive console statements

### Phase 2: Input Validation
**Goal**: All server action inputs are validated against schemas before any database operation executes
**Depends on**: Phase 1
**Requirements**: VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):
  1. Submitting a form with missing or malformed fields returns a descriptive validation error (not a database error or silent failure)
  2. Every mutation server action rejects invalid input types (e.g., string where number expected, missing required fields) before reaching Supabase
  3. A shared auth middleware pattern automatically rejects unauthenticated calls to all protected actions
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Design System Foundation
**Goal**: A complete set of primitive UI components exists that enforces visual consistency by default
**Depends on**: Nothing (independent of security track)
**Requirements**: DSN-01, DSN-02, DSN-03, DSN-04, DSN-05, DSN-06, DSN-07
**Success Criteria** (what must be TRUE):
  1. Importing Button, Input, Card, Badge, or Modal from the primitives directory produces a correctly styled component without any additional className overrides
  2. All primitive components support variant props (e.g., Button variant="destructive") that map to the design token color palette
  3. Design tokens in globals.css define the spacing scale, color palette, and typography -- and all primitives reference these tokens (not hardcoded values)
  4. The cn() utility correctly merges conditional Tailwind classes without conflicts
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: RLS Audit & Hardening
**Goal**: Every database table has documented, minimal-privilege RLS policies and the app sends proper security headers
**Depends on**: Phase 2 (validation informs which checks happen at app layer vs DB layer)
**Requirements**: RLS-01, RLS-02, RLS-03
**Success Criteria** (what must be TRUE):
  1. A single audit document describes the effective RLS policy state for every table (consolidated from 37 migrations)
  2. An authenticated user querying the users table cannot see other users' email addresses or phone numbers
  3. Response headers include Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy on every page load
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: UI Migration & Production Polish
**Goal**: Every page uses the design system primitives, dark mode works everywhere, and users get clear feedback on all actions
**Depends on**: Phase 3 (primitives must exist before migration)
**Requirements**: UIM-01, UIM-02, UIM-03, POL-01, POL-02, POL-03
**Success Criteria** (what must be TRUE):
  1. Zero instances of hardcoded bg-white or inline dark: color overrides remain in the codebase -- all colors use CSS variable classes
  2. Toggling between light and dark mode on any page produces correct, consistent colors with no flashing or broken elements
  3. Completing any mutation (create item, lend, return, delete) shows a toast notification confirming success or explaining the failure
  4. Every list view (items, contacts, groups, borrow records) displays a helpful empty state when no data exists
  5. Form submissions and page transitions show visible loading indicators
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5
Note: Phases 2 and 3 touch independent files and could be interleaved if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Critical Security Fixes | 0/2 | Complete    | 2026-02-23 |
| 2. Input Validation | 0/? | Not started | - |
| 3. Design System Foundation | 0/? | Not started | - |
| 4. RLS Audit & Hardening | 0/? | Not started | - |
| 5. UI Migration & Production Polish | 0/? | Not started | - |
