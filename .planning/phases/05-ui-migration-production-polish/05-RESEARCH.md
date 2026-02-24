# Phase 5: UI Migration & Production Polish - Research

**Researched:** 2026-02-23
**Domain:** CSS variable migration, toast notifications, empty states, loading indicators
**Confidence:** HIGH

## Summary

Phase 5 is a migration and polish phase -- no new libraries, no new features, no schema changes. The Phase 3 design system foundation created five primitives (`Button`, `Input`, `Card`, `Badge`, `Modal`) in `components/ui/` that use CSS custom properties. Currently, **zero** application components import from `components/ui/`. All 28 application components still use hardcoded Tailwind gray/white classes and inline `dark:` prefixes. The work breaks down into four distinct tracks:

1. **Color variable migration** -- Replace ~371 hardcoded color class instances (`bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`) across 31 files with CSS variable classes (`bg-[var(--bg-base)]`, `text-[var(--text-primary)]`, etc.) and remove the ~185 inline `dark:` overrides that become unnecessary when using CSS variables.
2. **Component primitive migration** -- Replace manual HTML patterns (hand-styled buttons, inputs, cards, badges, modals) with imports from `@/components/ui`. This covers 7 files currently importing from `@/components/Card` (the old Card.tsx) plus all files with raw `<button>`, `<input>`, and portal-based modals.
3. **Toast notification system** -- Build a lightweight toast provider (React Context + portal) with success/error variants, bottom-center positioning, auto-dismiss, and stacking. No external library needed -- React 19 Context + createPortal is sufficient.
4. **Empty states and loading indicators** -- Add empty state components (text + CTA) to all list views, skeleton loading screens for page transitions, and button loading states for form submissions.

**Primary recommendation:** Migrate colors and primitives first (they are mechanical, bulk changes), then layer in toast notifications and empty states on top of the already-migrated components. The old `Card.tsx` utility classes in `globals.css` (`.btn-primary`, `.card`, `.badge-*`, `.input-field`, `.modal-*`) should be removed once migration is complete.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Toast notifications: bottom center, auto-dismiss 3s (success) / 6s (error) with dismiss button, stack up to 3, green success / red error
- Empty states: text + CTA button only (no illustrations/icons), friendly tone, every list gets a CTA
- Loading indicators: skeleton screens for page-level loading
- Dark mode: replace all hardcoded bg-white/text-gray-X/border-gray-X with CSS variable classes, audit borders/dividers, adjust shadows for dark mode
- Use the frontend-design skill during implementation for distinctive UI

### Claude's Discretion
- Form submission loading indicator style (button spinner, overlay, etc.)
- Search loading indicator approach
- Navigation transition indicator (progress bar vs none)
- Whether filtered/search empty states differ from truly-empty states
- Default color mode preference
- Skeleton screen specific layouts per page

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UIM-01 | All hardcoded `bg-white` and color values replaced with CSS variable classes | Color variable migration track: 371 instances across 31 files identified, CSS variables already defined in globals.css |
| UIM-02 | All existing components migrated to use new primitive components | Component primitive migration track: 7 files importing old Card.tsx, all files with raw buttons/inputs/modals identified |
| UIM-03 | Dark mode consistency verified and fixed across all pages and components | Color migration eliminates 185 inline `dark:` overrides; remaining palette-specific dark: usage (Badge component) is correct by design |
| POL-01 | Toast notification system implemented for action success/failure feedback | Toast system architecture: React Context + portal, no external library needed |
| POL-02 | Empty state components added to all list views | 8 list views identified: dashboard (3 sections), items, contacts, groups, borrow records, group detail inventory |
| POL-03 | Loading states added for async operations | Skeleton screens for pages, button spinners for forms, search spinners for debounced search |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 19 | 19.2.0 | Context + createPortal for toast system | Already installed; Context is the standard pattern for cross-cutting UI concerns |
| class-variance-authority | ^0.7.1 | CVA variants for existing primitives | Already installed; used by all Phase 3 primitives |
| clsx + tailwind-merge | ^2.1.1 / ^3.5.0 | cn() utility for className composition | Already installed in lib/utils.ts |
| Tailwind CSS v4 | ^4 | Utility-first CSS with CSS variable integration | Already installed; `@custom-variant dark` already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | -- | -- | No new dependencies needed for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast | react-hot-toast or sonner | External dependency for a simple feature; the spec (bottom-center, 3s/6s, max 3) is straightforward enough for a 50-line custom implementation |
| Custom skeletons | react-loading-skeleton | External dependency; Tailwind animate-pulse + hardcoded dimensions is simpler and already available |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
components/
├── ui/                    # Design system primitives (Phase 3, already exists)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── modal.tsx
│   └── index.ts
├── toast-provider.tsx     # NEW: Toast context + portal renderer
├── empty-state.tsx        # NEW: Reusable empty state component
├── Card.tsx               # OLD: Remove after migration complete
└── [existing components]  # Migrate to use ui/ imports
```

### Pattern 1: Toast Provider (React Context + Portal)

**What:** A context provider wrapping the app that exposes `useToast()` hook, renders toasts via portal to `document.body`.

**When to use:** Any client component that calls a server action and needs to show success/error feedback.

**Example:**
```typescript
// components/toast-provider.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => {
      const next = [...prev, { id, type, message }]
      return next.slice(-3) // Max 3 toasts, oldest dismissed first
    })

    const duration = type === 'success' ? 3000 : 6000
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center">
          {toasts.map(toast => (
            <div key={toast.id} className={`...toast styles...`}>
              {toast.message}
              {toast.type === 'error' && (
                <button onClick={() => dismissToast(toast.id)}>Dismiss</button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
```

**Integration point:** Wrap inside `ThemeProvider` in `app/layout.tsx`. The toast portal z-index (60) must exceed the Modal z-index (50).

### Pattern 2: CSS Variable Color Replacement

**What:** Mechanical find-and-replace of hardcoded Tailwind gray/white classes with CSS variable equivalents.

**When to use:** Every component file with hardcoded colors.

**Mapping table (the definitive reference for migration):**

| Hardcoded Class | CSS Variable Replacement | Usage |
|----------------|--------------------------|-------|
| `bg-white` | `bg-[var(--bg-base)]` | Page backgrounds, modal backgrounds |
| `bg-gray-50` | `bg-[var(--bg-surface)]` | Card backgrounds, secondary surfaces |
| `bg-gray-100` | `bg-[var(--bg-elevated)]` | Hover states, tertiary surfaces |
| `bg-gray-200` | `bg-[var(--bg-elevated)]` | Alternative elevated surface |
| `bg-gray-800` (in dark:) | Remove (handled by CSS variable) | Dark mode card backgrounds |
| `text-gray-900` | `text-[var(--text-primary)]` | Main text |
| `text-gray-700` | `text-[var(--text-primary)]` | Strong secondary text |
| `text-gray-600` | `text-[var(--text-secondary)]` | Supporting text |
| `text-gray-500` | `text-[var(--text-secondary)]` | Secondary text |
| `text-gray-400` | `text-[var(--text-tertiary)]` | Muted/helper text |
| `text-gray-300` | `text-[var(--text-tertiary)]` | Very muted text |
| `border-gray-200` | `border-[var(--border)]` | Borders in light mode |
| `border-gray-300` | `border-[var(--border)]` | Input borders, dividers |
| `border-gray-600` (in dark:) | Remove (handled by CSS variable) | Dark mode borders |
| `border-gray-700` (in dark:) | Remove (handled by CSS variable) | Dark mode borders |
| `hover:bg-gray-50` | `hover:bg-[var(--bg-surface)]` | Hover states |
| `hover:bg-gray-100` | `hover:bg-[var(--bg-elevated)]` | Hover states |
| `hover:bg-gray-200` | `hover:bg-[var(--bg-elevated)]` | Hover states |

**Critical rule:** After replacing with CSS variables, remove ALL corresponding `dark:bg-gray-*`, `dark:text-gray-*`, `dark:border-gray-*` overrides from the same element. The CSS variables handle dark mode automatically.

### Pattern 3: Primitive Component Migration

**What:** Replace hand-styled HTML elements with `@/components/ui` imports.

**When to use:** Every component that manually styles buttons, inputs, cards, badges, or modals.

**Example migration (button):**
```typescript
// BEFORE
<button className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 ...">
  Lend Items
</button>

// AFTER
import { Button } from '@/components/ui'
<Button variant="primary">Lend Items</Button>
```

**Example migration (card):**
```typescript
// BEFORE (using old Card.tsx)
import { Card } from './Card'
<Card interactive onClick={fn} variant="compact">...</Card>

// AFTER (using ui/card.tsx)
import { Card } from '@/components/ui'
<Card interactive onClick={fn} variant="compact">...</Card>
```

Note: The `ui/Card` has the same API as the old `Card` for the base card component. The domain-specific card variants (`ItemCard`, `ContactCard`, `GroupCard`, `BorrowRecordCard`) in `Card.tsx` must be migrated to use the `ui/Card` internally but can keep their prop-based API.

### Pattern 4: Empty State Component

**What:** A simple, reusable component for list views with no data.

**Example:**
```typescript
// components/empty-state.tsx
import { Button } from '@/components/ui'

interface EmptyStateProps {
  message: string
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void
}

export function EmptyState({ message, ctaLabel, ctaHref, onCtaClick }: EmptyStateProps) {
  return (
    <div className="text-center py-12 rounded-lg border border-dashed border-[var(--border)]">
      <p className="text-[var(--text-secondary)] mb-4">{message}</p>
      {ctaHref ? (
        <a href={ctaHref}><Button variant="primary">{ctaLabel}</Button></a>
      ) : (
        <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
      )}
    </div>
  )
}
```

### Pattern 5: Skeleton Loading Screens

**What:** Tailwind animate-pulse divs matching page layout structure.

**Example:**
```typescript
// app/items/loading.tsx (Next.js convention)
export default function ItemsLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="h-9 w-32 bg-[var(--bg-elevated)] rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

**Next.js integration:** Files named `loading.tsx` in app route directories are automatically used as Suspense fallbacks during navigation. This requires **no** code changes to pages -- just adding the file.

### Anti-Patterns to Avoid

- **Mixing old and new Card imports:** During migration, ensure each file imports from either `@/components/Card` (old) OR `@/components/ui` (new), never both. Complete migration per-file.
- **Keeping dead CSS utility classes:** After all components migrate to primitives, remove `.btn-primary`, `.btn-secondary`, `.card`, `.badge-*`, `.input-field`, `.modal-*` from `globals.css`. These are superseded by CVA-based primitives.
- **Adding new `dark:` prefixes:** The whole point of CSS variables is that dark mode is handled by the variable definitions. New `dark:` overrides should only appear for palette-specific colors (like Badge success/error/warning/info variants which use fixed color scales, not neutral gray scales).
- **Giant monolithic PRs:** Migrate one file or one concern at a time. Color migration and primitive migration can happen in parallel across files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Class name composition | String concatenation | `cn()` from `@/lib/utils` | tailwind-merge resolves conflicts (p-4 + p-2 = p-2) |
| Button variants | Manual className strings | `Button` from `@/components/ui` | CVA handles variant logic, consistent styling |
| Input styling | Repeated border/focus classes | `Input` from `@/components/ui` | Includes label, error message, consistent sizing |
| Card surface | bg-white dark:bg-gray-800 | `Card` from `@/components/ui` | Uses CSS variables, handles dark mode automatically |
| Status badges | Inline conditional class strings | `Badge` from `@/components/ui` | 5 variants with proper dark mode support |
| Modal dialogs | Raw createPortal + escape handlers | `Modal` from `@/components/ui` | Portal, escape, click-outside, scroll lock built in |
| Loading skeleton | Custom animation CSS | Tailwind `animate-pulse` + `bg-[var(--bg-elevated)]` | Built into Tailwind, theme-aware via CSS variables |

**Key insight:** The Phase 3 primitives exist and are battle-tested. Every hand-rolled button, input, card, badge, or modal in the codebase is tech debt that should be replaced, not duplicated.

## Common Pitfalls

### Pitfall 1: Dark Mode Flash on Page Load
**What goes wrong:** User sees a flash of light mode before dark theme applies.
**Why it happens:** The ThemeProvider reads localStorage in a useEffect (client-side only). The initial server render always uses light mode.
**How to avoid:** Add an inline `<script>` in `app/layout.tsx` `<head>` that reads localStorage and sets `data-theme` synchronously before React hydrates. This is a common pattern (next-themes does this).
**Warning signs:** Visible white flash when loading any page with dark mode preference saved.

### Pitfall 2: Forgetting to Remove Paired `dark:` Overrides
**What goes wrong:** After replacing `bg-white` with `bg-[var(--bg-base)]`, the now-redundant `dark:bg-gray-800` is left in place, causing conflicts.
**Why it happens:** The `dark:` prefixed classes are often on the same element but visually separated in the className string.
**How to avoid:** For every element being migrated, search for ALL `dark:` prefixed classes on that element and remove the ones that are now handled by CSS variables.
**Warning signs:** Elements that look correct in light mode but wrong in dark mode.

### Pitfall 3: Missing Textarea/Select Styling
**What goes wrong:** The Phase 3 primitives include Button, Input, Card, Badge, Modal -- but NOT textarea or select. Forms with these elements look inconsistent.
**Why it happens:** textarea and select were not in the Phase 3 scope.
**How to avoid:** Apply CSS variable classes directly to textarea and select elements using the same pattern as the Input primitive: `bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border)]`. Do NOT create new primitives for these -- keep it simple.
**Warning signs:** Textareas or selects that appear white in dark mode.

### Pitfall 4: Toast Z-Index Collision with Modals
**What goes wrong:** Toast notifications appear behind open modals.
**Why it happens:** Modal uses z-50; if toast uses z-50 or lower, modals win.
**How to avoid:** Toast portal must use z-[60] (above Modal's z-50).
**Warning signs:** Toast not visible when a modal is open.

### Pitfall 5: Old Card.tsx Domain Components Still Used
**What goes wrong:** The old `Card.tsx` exports `Card`, `ItemCard`, `ContactCard`, `GroupCard`, `BorrowRecordCard`. Removing Card.tsx before migrating all consumers breaks the app.
**Why it happens:** 7 files import from the old Card.tsx.
**How to avoid:** Migrate Card.tsx domain components to use `ui/Card` internally first, then update consumer imports. Or migrate consumers one by one, leaving Card.tsx until all consumers are migrated.
**Warning signs:** Build errors from missing imports.

### Pitfall 6: Inline Error Messages vs Toast Notifications
**What goes wrong:** Components show both inline error messages AND toast notifications for the same error.
**Why it happens:** Existing components have inline `{error && <div>...}` patterns. Adding toasts without removing inline messages creates duplicates.
**How to avoid:** For mutations (create, update, delete, lend, return), use toast notifications. For form validation errors (field-level), keep inline error messages. Clear separation: toasts are for operation outcomes, inline errors are for input validation.
**Warning signs:** Error messages appearing in two places simultaneously.

## Code Examples

### Color Migration Example (Complete File)
```typescript
// BEFORE: components/contact-list-section.tsx
<input className="w-full px-4 py-2 border border-gray-300 rounded-lg ..." />
<div className="text-gray-400"><svg .../></div>
<p className="text-gray-500">No contacts match...</p>
<button className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>

// AFTER:
import { Input, Button } from '@/components/ui'
<Input placeholder="Search contacts..." />
<div className="text-[var(--text-tertiary)]"><svg .../></div>
<p className="text-[var(--text-secondary)]">No contacts match...</p>
<Button variant="destructive" size="sm">Delete</Button>
```

### Toast Usage in Server Action Consumers
```typescript
// In a client component that calls a server action
import { useToast } from '@/components/toast-provider'

function MyComponent() {
  const { addToast } = useToast()

  const handleDelete = async (id: string) => {
    const result = await deleteItem({ itemId: id })
    if (result?.serverError) {
      addToast('error', result.serverError)
    } else {
      addToast('success', 'Item deleted successfully')
    }
  }
}
```

### Next.js loading.tsx Skeleton
```typescript
// app/contacts/loading.tsx
export default function ContactsLoading() {
  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-center">
        <div className="h-9 w-40 bg-[var(--bg-elevated)] rounded animate-pulse" />
        <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 bg-[var(--bg-elevated)] rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
```

## Codebase Audit Results

### Hardcoded Color Instances (Must Migrate)

| Pattern | Count | Files |
|---------|-------|-------|
| `bg-white` | 37 | 17 files |
| `bg-gray-*` | 77 | 24 files |
| `text-gray-*` | 197 | 31 files |
| `border-gray-*` | 60 | 19 files |
| `dark:` overrides | 185 | 19 files |
| **Total** | **~556** | **~31 unique files** |

### Files Using Old Card.tsx (Must Migrate Imports)

| File | Imports |
|------|---------|
| `components/my-inventory-section.tsx` | `ItemCard` |
| `components/contact-list-section.tsx` | `ContactCard` |
| `components/dashboard-content.tsx` | `Card`, `ItemCard` |
| `components/items-page-content.tsx` | `Card` |
| `components/contact-detail-content.tsx` | `ItemCard` |
| `app/groups/page.tsx` | `GroupCard` |
| `app/groups/[id]/page.tsx` | `ItemCard` |

### List Views Needing Empty States (POL-02)

| View | Location | Current State |
|------|----------|---------------|
| Items I'm Borrowing | `dashboard-content.tsx` | Has basic `<p>` text, no CTA |
| Items I've Lent Out | `dashboard-content.tsx` | Has basic `<p>` text, no CTA |
| My Items | `dashboard-content.tsx` | Has basic `<p>` text, no CTA |
| My Inventory | `my-inventory-section.tsx` | Has styled div, no CTA |
| Borrowed Items | `items-page-content.tsx` | Has styled div, no CTA |
| Contacts | `contacts/page.tsx` | Has text + CTA (partially done) |
| Groups | `groups/page.tsx` | Has styled div, no actionable CTA button |
| Group Inventory | `groups/[id]/page.tsx` | Has styled div, no CTA |
| Contact Borrow History | `contact-detail-content.tsx` | Partially exists |
| Borrow Records | `borrow/page.tsx` | Page is stub, needs empty state |

### Mutations Needing Toast Feedback (POL-01)

| Action | File | Current Feedback |
|--------|------|------------------|
| `createItem` | `add-item-form.tsx` | Inline message (success/error) |
| `deleteItem` | `delete-item-button.tsx` | None |
| `createContact` | `add-contact-modal.tsx` | Modal closes on success |
| `deleteContact` | `contact-list-section.tsx` | Inline confirm dialog |
| `batchLendToContact` | `my-inventory-section.tsx` | Inline feedback message |
| `returnItem` | `contact-detail-content.tsx` | None visible |
| `borrowItem` | `borrow-request-modal.tsx` | None visible |
| `createGroup` | `groups/create-group-form.tsx` | Inline |
| `addItemsToGroup` | `groups/[id]/group-items-manager.tsx` | Alert |
| `joinGroupByInviteCode` | `groups/join/[inviteCode]/page.tsx` | Redirect on success |
| `linkContactToUser` | `contact-detail-content.tsx` | None visible |
| `updateItem` | `item-detail-modal.tsx` | None visible |
| `acceptBorrowRequest` | `borrow-request-modal.tsx` | None visible |
| `rejectBorrowRequest` | `borrow-request-modal.tsx` | None visible |

### Pages Needing Skeleton Loading (POL-03)

| Page | Route | Data Fetched |
|------|-------|-------------|
| Dashboard | `/dashboard` | borrowed items, user items, lent items |
| Items | `/items` | user items, borrowed items |
| Contacts | `/contacts` | contacts list |
| Groups | `/groups` | user groups |
| Group Detail | `/groups/[id]` | group details, items, user items |
| Contact Detail | `/contacts/[id]` | contact with borrow history |
| Item Detail | `/items/[id]` | item details with borrow info |
| User Profile | `/users/[id]` | user profile, public items |

### CSS Utility Classes to Remove After Migration

From `globals.css` lines 146-229:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` (replaced by `Button` primitive)
- `.card` and `[data-theme="dark"] .card` (replaced by `Card` primitive)
- `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-info` and dark variants (replaced by `Badge` primitive)
- `.input-field` and dark variant (replaced by `Input` primitive)
- `.modal-overlay`, `.modal-content` (replaced by `Modal` primitive)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `dark:bg-gray-800` inline overrides | CSS custom properties with `[data-theme]` selector | Phase 3 (this project) | Eliminates ~185 dark: overrides when adopted |
| Raw `createPortal` in each modal | `Modal` primitive with escape/click-outside/scroll-lock | Phase 3 (this project) | 5+ modal components can be simplified |
| Manual className strings for buttons | `Button` CVA component with variant prop | Phase 3 (this project) | Consistent styling with one prop |
| Inline success/error divs per component | Toast provider with global `useToast()` hook | This phase (new) | Centralized feedback, consistent UX |
| No loading states on navigation | Next.js `loading.tsx` convention with skeletons | Next.js 13+ built-in | Zero code changes to pages needed |

## Open Questions

1. **Dark mode flash prevention**
   - What we know: ThemeProvider reads localStorage in useEffect (client-side). Initial render is always light.
   - What's unclear: Whether the current implementation causes visible flash. It may be fast enough to not matter.
   - Recommendation: Add a blocking `<script>` in layout.tsx head to set `data-theme` before paint. Simple, proven pattern. But test first -- if no flash is visible, skip it.

2. **Old Card.tsx domain components**
   - What we know: `ItemCard`, `ContactCard`, `GroupCard`, `BorrowRecordCard` are used in 7 files. They have domain-specific props.
   - What's unclear: Whether to migrate these domain components to use `ui/Card` internally, or inline the card styling at each call site.
   - Recommendation: Migrate `Card.tsx` domain components to use `ui/Card` + `ui/Badge` internally while keeping their existing prop APIs. This is the lowest-risk approach -- consumer code doesn't change, only the internal implementation of the domain cards.

3. **Textarea and select primitives**
   - What we know: 5 files use `<textarea>`, several use `<select>`. No UI primitives exist for these.
   - What's unclear: Whether to create primitives or just apply CSS variable classes directly.
   - Recommendation: Apply CSS variable classes directly (no new primitives). Keep it simple per project philosophy.

## Sources

### Primary (HIGH confidence)
- Codebase audit: Direct grep/glob analysis of all 31+ component files
- Phase 3 verification: `.planning/phases/03-design-system-foundation/03-VERIFICATION.md` confirms all 5 primitives are complete and verified
- `app/globals.css`: CSS custom properties verified at lines 74-99 (light/dark definitions)
- `components/ui/*.tsx`: All 5 primitives read and verified

### Secondary (MEDIUM confidence)
- Next.js loading.tsx convention: Standard Next.js App Router feature for Suspense-based loading states (documented in Next.js docs)
- React 19 Context + createPortal pattern: Standard React pattern for toast systems

### Tertiary (LOW confidence)
- None -- all findings based on direct codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all tools already installed
- Architecture: HIGH -- patterns are mechanical migration + well-understood React patterns (Context, portals)
- Pitfalls: HIGH -- identified from direct codebase analysis, not hypothetical
- Scope: HIGH -- exact counts of instances per file type audited via grep

**Research date:** 2026-02-23
**Valid until:** Indefinite (codebase-specific findings, no external version dependencies)
