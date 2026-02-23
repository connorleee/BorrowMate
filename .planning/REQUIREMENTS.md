# Requirements: BorrowMate Security & UX Refinement

**Defined:** 2026-02-22
**Core Value:** Users can quickly lend items to contacts and always know who has what

## v1 Requirements

### Critical Security

- [x] **SEC-01**: Middleware auth guard correctly protects all authenticated routes (fix broken startsWith logic)
- [x] **SEC-02**: `returnItem()` server action validates user authentication before processing
- [x] **SEC-03**: All console.log/console.error statements reviewed and sensitive data removed from output

### Input Validation

- [x] **VAL-01**: Zod schemas defined for all server action inputs (items, contacts, borrow, groups, users, auth, notifications)
- [x] **VAL-02**: next-safe-action client configured with auth middleware pattern
- [x] **VAL-03**: All mutation server actions migrated to use Zod-validated inputs via next-safe-action

### RLS & Hardening

- [ ] **RLS-01**: All RLS policies across 37 migrations audited and documented in single effective-state document
- [ ] **RLS-02**: Users table SELECT policy tightened to not expose email/phone to all authenticated users
- [ ] **RLS-03**: Security headers added (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)

### Design System

- [ ] **DSN-01**: `cn()` utility function created using clsx + tailwind-merge
- [ ] **DSN-02**: Button primitive component built with CVA variants (primary, secondary, destructive, ghost, sizes)
- [ ] **DSN-03**: Input primitive component built with CVA variants (consistent styling, error states, labels)
- [ ] **DSN-04**: Card primitive component built with CVA variants (consistent surface styling)
- [ ] **DSN-05**: Badge primitive component built with CVA variants (status colors, sizes)
- [ ] **DSN-06**: Modal primitive component built with shared portal/overlay/escape logic
- [ ] **DSN-07**: Design tokens established in globals.css (spacing scale, color palette, typography)

### UI Migration

- [ ] **UIM-01**: All hardcoded `bg-white` and color values replaced with CSS variable classes
- [ ] **UIM-02**: All existing components migrated to use new primitive components
- [ ] **UIM-03**: Dark mode consistency verified and fixed across all pages and components

### Production Polish

- [ ] **POL-01**: Toast notification system implemented for action success/failure feedback
- [ ] **POL-02**: Empty state components added to all list views (items, contacts, groups, borrow records)
- [ ] **POL-03**: Loading states added for async operations (page loads, form submissions, searches)

## v2 Requirements

### Security Enhancements

- **SEC-V2-01**: Rate limiting added (Arcjet or similar) for auth endpoints and mutations
- **SEC-V2-02**: SECURITY DEFINER functions audited and replaced where possible
- **SEC-V2-03**: Comprehensive WCAG accessibility audit

### UX Enhancements

- **UX-V2-01**: Confirmation dialogs for all destructive actions (delete item, remove contact)
- **UX-V2-02**: Skeleton loading states for page-level data fetching
- **UX-V2-03**: Micro-animations and transitions for state changes
- **UX-V2-04**: Keyboard navigation support across all interactive elements

## Out of Scope

| Feature | Reason |
|---------|--------|
| New feature development | This milestone is hardening and polish only |
| Mobile native app | Web-first, responsive design only |
| Real-time chat | Not core to lending value |
| Third-party UI library (shadcn/ui) | Existing CSS variable system is solid, just needs consistent adoption |
| Database schema changes | Preserve existing data, only change RLS policies |
| Full WCAG audit | Defer to v2, include basic ARIA in form validation work |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| VAL-01 | Phase 2 | Complete |
| VAL-02 | Phase 2 | Complete |
| VAL-03 | Phase 2 | Complete |
| DSN-01 | Phase 3 | Pending |
| DSN-02 | Phase 3 | Pending |
| DSN-03 | Phase 3 | Pending |
| DSN-04 | Phase 3 | Pending |
| DSN-05 | Phase 3 | Pending |
| DSN-06 | Phase 3 | Pending |
| DSN-07 | Phase 3 | Pending |
| RLS-01 | Phase 4 | Pending |
| RLS-02 | Phase 4 | Pending |
| RLS-03 | Phase 4 | Pending |
| UIM-01 | Phase 5 | Pending |
| UIM-02 | Phase 5 | Pending |
| UIM-03 | Phase 5 | Pending |
| POL-01 | Phase 5 | Pending |
| POL-02 | Phase 5 | Pending |
| POL-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
