# Coding Conventions

**Analysis Date:** 2026-02-07

## Naming Patterns

**Files:**
- **Client Components**: kebab-case with descriptive names (e.g., `batch-lend-modal.tsx`, `add-contact-button.tsx`, `my-inventory-section.tsx`)
- **Server Actions**: kebab-case or simple names in `actions.ts` files (e.g., `app/items/actions.ts`, `app/contacts/actions.ts`)
- **Page Components**: PascalCase when exported as default or component files (e.g., `page.tsx`), camelCase for internal pages
- **Route Handlers**: `route.ts` (e.g., `app/auth/callback/route.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Contact`, `Item`, `BatchLendModalProps`)
- **Constants**: UPPER_SNAKE_CASE for configuration values, camelCase for magic strings in inline constants

**Functions:**
- **Async functions** (server actions): camelCase, descriptive verb-noun pattern (e.g., `getContacts()`, `createItem()`, `batchLendToContact()`)
- **Event handlers** (client): camelCase with handle prefix (e.g., `handleSubmit()`, `handleContinueToLend()`, `toggleItemSelection()`)
- **Utility/helper functions**: camelCase, clear intent (e.g., `searchContacts()`, `createBorrowRequest()`)

**Variables:**
- **State variables**: camelCase (e.g., `selectedItems`, `isMultiSelectMode`, `searchQuery`)
- **Boolean flags**: is/has prefix (e.g., `isOpen`, `hasPersonalItems`, `isLoading`)
- **Collections**: plural nouns (e.g., `selectedItems`, `searchResults`, `borrowRecords`)
- **Maps/Objects**: camelCase with descriptive suffix (e.g., `contactsMap`, `groupedByContact`)

**Types:**
- **Interface names**: PascalCase with `Props` or `State` suffix for component props (e.g., `BatchLendModalProps`, `MyInventorySectionProps`, `FeedbackMessage`)
- **Database models**: PascalCase matching table names (e.g., `Contact`, `Item`, `BorrowRecord`)
- **Union types**: PascalCase (e.g., `'success' | 'error'` for message types)
- **Enums**: PascalCase values as string literals in type definitions

## Code Style

**Formatting:**
- **Indentation**: 2 spaces (observed in all source files)
- **Line length**: No hard limit enforced, but files are readable
- **Semicolons**: Required at end of statements
- **Quotes**: Single quotes for strings (e.g., `'use client'`, `'Not authenticated'`)
- **Arrow functions**: Preferred over `function` keyword for components and callbacks

**Linting:**
- **ESLint**: Uses `eslint.config.mjs` with Next.js defaults
- **Config**: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- **Run command**: `npm run lint`
- **Key settings**: TypeScript strict mode enabled, Next.js web vitals rules enforced

**TypeScript:**
- **Strict mode**: Enabled (`"strict": true` in `tsconfig.json`)
- **Target**: ES2017
- **Module resolution**: bundler

## Import Organization

**Order:**
1. React and external libraries (e.g., `import { useState } from 'react'`)
2. Next.js modules (e.g., `import { redirect } from 'next/navigation'`, `import Link from 'next/link'`)
3. Project utilities and services (e.g., `import { createClient } from '@/utils/supabase/server'`)
4. Components (e.g., `import { ItemCard } from './Card'`)
5. Server actions (e.g., `import { createContact } from '@/app/contacts/actions'`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Use `@/utils/` for utilities, `@/app/` for server routes and actions, `@/components/` for client components
- Example: `import { createClient } from '@/utils/supabase/server'`

**Server Actions imports:**
- Client components importing server actions: `import { searchContacts } from '@/app/contacts/actions'`
- Server actions importing utilities: `import { createClient } from '@/utils/supabase/server'`
- Server actions importing Next.js internals: `import { revalidatePath } from 'next/cache'`, `import { redirect } from 'next/navigation'`

## Error Handling

**Patterns:**
- **Return objects** from server actions: `{ error: 'message' }` or `{ data: result }` or `{ success: true }`
- **Empty array fallback**: `return []` on error for data queries (e.g., `app/items/actions.ts` line 22, `app/contacts/actions.ts` line 10)
- **Null fallback**: `return null` for single-record queries when not found (e.g., `getItemDetails()` returns null on error)
- **Console.error logging**: All Supabase errors logged before return (e.g., `console.error('Error fetching contacts:', JSON.stringify(error, null, 2))`)
- **Graceful degradation**: Non-critical operations (notifications) continue even if fail (e.g., `createBorrowRequest()` line 446: "Don't fail the request if notification fails")
- **Optional error details**: Use `JSON.stringify(error, null, 2)` for readable error logging

**Authentication checks:**
- All server actions start with `const { data: { user } } = await supabase.auth.getUser()`
- Return early with `{ error: 'Not authenticated' }` if user is null
- Client-side components wrap in `typeof document === 'undefined'` checks for portal safety

**Validation pattern:**
```typescript
// Verify resource ownership/access before proceeding
if (contactError || !contact || contact.owner_user_id !== user.id) {
    return { error: 'Contact not found or unauthorized' }
}
```

## Logging

**Framework:** Native `console` API (no external logging framework)

**Patterns:**
- **Info/Debug**: `console.log()` for data state (e.g., `createItem()` logs formData and result)
- **Errors**: `console.error()` for all Supabase/API failures with context (e.g., `'Error creating borrow records:', insertError`)
- **Error formatting**: Use `JSON.stringify(error, null, 2)` for multiline readability
- **When to log**: Data mutations (create/update/delete), error conditions, state transitions
- **When NOT to log**: Simple data reads without errors, UI state changes

## Comments

**When to Comment:**
- **Complex logic**: Explain WHY, not WHAT (e.g., borrow/actions.ts lines 14-20 explaining MVP trade-offs)
- **RLS gotchas**: Flag potential Row-Level Security issues (e.g., "Fetch separately to avoid circular RLS dependencies" in `acceptBorrowRequest()`)
- **Deprecated code**: Mark clearly with `// DEPRECATED:` prefix with migration path
- **Non-obvious decisions**: Explain design choices (e.g., contact-centric model, grouping logic)
- **Workarounds**: Comment temporary solutions (e.g., "Guard against null/undefined records" in `getActiveBorrowsGroupedByContact()`)

**JSDoc/TSDoc:**
- **Minimal usage**: Not extensively used in this codebase
- **Type hints**: Rely on TypeScript interfaces and inline type annotations
- **Component props**: Define interface types; no need for JSDoc
- **Return types**: Explicitly typed in function signatures (e.g., `export async function getContacts(): Promise<Contact[]>`)

## Function Design

**Size:**
- Functions range from ~20 lines (simple queries) to ~150+ lines (complex mutations with fallbacks)
- Preference for focused, single-responsibility functions where possible
- Multi-step operations (create contact → create membership → revalidate) kept together for transactional clarity

**Parameters:**
- **Server actions**: Typically accept `FormData` or individual typed parameters
- **Client components**: Accept typed props interface (e.g., `BatchLendModalProps`)
- **Utility functions**: Accept destructured objects when 2+ parameters needed (e.g., `batchLendToContact(itemIds, contactId, dueDate?)`)
- **Optional parameters**: Use trailing optional markers (e.g., `dueDate?: string`)

**Return Values:**
- **Server actions**: Return object with `error` and/or `data` field for consistency
- **Data queries**: Return array (default `[]` on error) or null/object (null on error)
- **Complex queries**: Return typed objects with nested properties (e.g., `{ contactId, contact, items }` from `getActiveBorrowsGroupedByContact()`)
- **Void operations**: Return `{ success: true }` or object with side effects indication

## Module Design

**Exports:**
- **Default exports**: Used for page components and main component exports
- **Named exports**: Used for utility functions and typed helpers (e.g., `export function Card(...)`, `export async function getContacts()`)
- **Single responsibility**: Each `actions.ts` file grouped by domain (items, contacts, borrow, groups, auth)

**Barrel Files:**
- **Card.tsx**: Exports multiple card variants (`Card`, `ItemCard`, `ContactCard`, `GroupCard`, `BorrowRecordCard`) with shared base styling
- **Pattern**: Main component + variants in single file when tightly related
- **Comments**: Section headers with `// ============= VARIANT NAME =============` format

**File structure:**
- **Components**: Self-contained in `/components` directory, client-side only
- **Server Actions**: Grouped in `/app/{domain}/actions.ts` by feature area
- **Pages**: In `/app/{route}/page.tsx` following Next.js App Router
- **Utils**: Supabase clients in `/utils/supabase/{server,client}.ts`

---

*Convention analysis: 2026-02-07*
