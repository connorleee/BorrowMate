# Milestones

## v1.0 Security & UX Refinement (Shipped: 2026-02-24)

**Phases completed:** 5 phases, 14 plans
**Timeline:** 2026-02-22 → 2026-02-24 (2 days)
**Codebase:** 9,558 LOC TypeScript
**Requirements:** 22/22 satisfied

**Key accomplishments:**
- Fixed disabled middleware auth guard and protected all authenticated routes
- Added Zod validation + next-safe-action to all 27 mutation server actions
- Built 5 CVA-based design system primitives (Button, Input, Card, Badge, Modal) with CSS variable tokens
- Audited and tightened all RLS policies; locked users table to owner-only with user_profiles view
- Added security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Migrated entire codebase to CSS variable classes — zero hardcoded grays remain
- Added toast notifications on all mutations, empty states on all list views, skeleton loading on all pages

**Tech Debt (accepted):**
- auth/page.tsx: raw inputs not migrated to ui/Input and ui/Button
- item-detail-modal.tsx: nested edit modal uses raw createPortal instead of ui/Modal
- borrow/actions.ts:401: self-lookup on users table instead of user_profiles (safe but inconsistent)

**Archives:** .planning/milestones/v1.0-ROADMAP.md, v1.0-REQUIREMENTS.md, v1.0-MILESTONE-AUDIT.md

---

