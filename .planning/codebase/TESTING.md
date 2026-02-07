# Testing Patterns

**Analysis Date:** 2026-02-07

## Test Framework

**Status:** Not detected

**Observation:** No test framework is currently installed or configured in this codebase.

- **package.json**: No jest, vitest, mocha, or other test runner in dependencies or devDependencies
- **Test files**: No `.test.*` or `.spec.*` files found in the project
- **Test configuration**: No jest.config.js, vitest.config.ts, or similar test configs

**Implication:** All validation and testing occurs manually via the Next.js dev server and production deployment. Type safety is enforced via TypeScript strict mode.

## Code Quality Safeguards (In Place of Tests)

**TypeScript Strict Mode:**
- `strict: true` in `tsconfig.json` enforces null checks, type safety, and error catching at compile time
- All function parameters and return types explicitly typed
- Interface-based prop validation for components

**Linting:**
- ESLint with Next.js config (`eslint-config-next/core-web-vitals`)
- Run via `npm run lint`
- Catches code quality issues, unused variables, potential bugs

**Type Safety in Components:**
```typescript
// Example: Props interface enforces contract
interface BatchLendModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItemIds: string[]
  onLend: (contactId: string, dueDate?: string) => Promise<void>
}

export default function BatchLendModal({
  isOpen,
  onClose,
  selectedItemIds,
  onLend
}: BatchLendModalProps) { ... }
```

**Type Safety in Server Actions:**
```typescript
// Example: Return type safety
export async function getContacts(): Promise<Contact[]> { ... }

// Example: Parameter validation via FormData type assertion
const name = formData.get('name') as string
const email = formData.get('email') as string | null
```

## Run Commands

**Development:**
```bash
npm run dev              # Start dev server (localhost:3000) - best for manual testing
npm run lint            # Run ESLint to check code quality
npm run build           # Production build (runs TypeScript checks)
```

**No automated test command** - testing is manual

## Manual Testing Approach

**Form Validation:**
- Components validate FormData input with TypeScript type assertions
- Supabase RLS policies enforce database-level validation
- Error messages returned to client for user feedback

**Server Action Validation:**
- Authentication check on every action: `const { data: { user } } = await supabase.auth.getUser()`
- Resource ownership checks before mutations (e.g., `contact.owner_user_id !== user.id` → error)
- Item availability checks before lending (e.g., `items.some(item => item.status === 'unavailable')` → error)

**Data Integrity:**
```typescript
// Example: Verify all items exist before mutation
const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, status')
    .in('id', itemIds)

if (itemsError || !items || items.length !== itemIds.length) {
    return { error: 'Some items not found' }
}
```

**UI State Testing (Manual):**
- Multi-select mode toggling verified via state management (`selectedItems: Set<string>`)
- Modal open/close state synchronized with form reset
- Debounced search (300ms) prevents excessive API calls

## Error Testing Patterns

**Server Action Error Handling:**
```typescript
// Pattern 1: Early return on error
const { data, error } = await supabase.from('table').select(...)
if (error) {
    console.error('Error fetching:', error)
    return { error: error.message }
}

// Pattern 2: Graceful degradation for non-critical operations
const { error: notificationError } = await supabase
    .from('notifications')
    .insert({...})

if (notificationError) {
    console.error('Error creating notification:', notificationError)
    // Don't fail the main operation - notification is secondary
}
```

**Client-Side Error Handling:**
```typescript
// Example from add-contact-modal.tsx
try {
    const result = await createContact(formData)
    if (result.error) {
        setError(result.error)
    } else {
        // Success path
        onClose()
    }
} catch (err) {
    setError(err instanceof Error ? err.message : 'An error occurred')
} finally {
    setIsLoading(false)
}
```

## Test Coverage Gaps

**Critical Areas Without Automated Tests:**

1. **Batch Lending Flow:**
   - File: `app/borrow/actions.ts` - `batchLendToContact()`
   - What's not tested: Item availability validation, contact ownership verification, partial batch failure recovery
   - Risk: Silent failures if contact ownership check has bugs; items marked unavailable but borrow_records not created
   - Priority: HIGH - core feature

2. **Contact-Centric Lending:**
   - Files: `app/contacts/actions.ts`, `components/batch-lend-modal.tsx`
   - What's not tested: Contact creation, search filtering, duplicate prevention, linked_user_id handling
   - Risk: Duplicate contacts, incorrect contact linking, orphaned borrow_records
   - Priority: HIGH - foundational to app

3. **Borrow Request Accept Flow:**
   - File: `app/borrow/actions.ts` - `acceptBorrowRequest()`
   - What's not tested: Duplicate contact prevention, RLS circular dependency workarounds, notification creation failures, partial acceptance failures
   - Risk: Duplicate contacts created, orphaned borrow_requests, notification failures cascade
   - Priority: HIGH - complex multi-step operation

4. **RLS Policy Validation:**
   - Files: Database migrations in `supabase/migrations/`
   - What's not tested: Contact access by owner, group item visibility, borrow_record lender/borrower access
   - Risk: Unauthorized data access, silent query failures, data leaks
   - Priority: CRITICAL - security-sensitive

5. **Server Action Return Types:**
   - All server actions return objects, but return type inconsistency not caught
   - Some return `{ error: string }`, others `{ data: T }`, others `{ success: true }`
   - Risk: Client code confused about result structure, error handling bugs
   - Priority: MEDIUM

6. **Component State Synchronization:**
   - Files: `components/my-inventory-section.tsx`, `components/batch-lend-modal.tsx`
   - What's not tested: Modal closing → state reset, multi-select mode toggle → UI updates, debounce cleanup on unmount
   - Risk: Stale state, memory leaks from uncleaned timeouts, race conditions
   - Priority: MEDIUM

7. **Edge Cases in Data Fetching:**
   - Files: Multiple action files
   - What's not tested: Null/undefined guards, empty result handling, concurrent requests, timeout behavior
   - Risk: App crashes on missing data, race conditions on concurrent lends
   - Priority: MEDIUM

8. **Styling and Dark Mode:**
   - Files: `components/*.tsx`, `app/globals.css`
   - What's not tested: CSS variable fallbacks, dark mode toggle persistence, responsive breakpoints
   - Risk: Styling issues in dark mode, mobile layouts break, accessibility issues
   - Priority: LOW - visual inspection sufficient

## Recommended Testing Approach (If Implementing Tests)

**Test Framework Choice:** Vitest (faster, ESM-native) or Jest (more ecosystem support)

**Priority Order for Test Coverage:**

1. **Unit Tests (Vitest)** - Server action validation logic
   - `batchLendToContact()` - item availability, contact ownership
   - `createContact()` - validation, duplicate handling
   - `acceptBorrowRequest()` - RLS workarounds, contact creation

2. **Integration Tests (Vitest + Supabase Test Client)** - End-to-end operations
   - Full borrow request flow: create → accept → verify contact created
   - Batch lending: multi-item select → lend → verify items unavailable
   - Contact operations: create → link user → verify in borrow records

3. **E2E Tests (Playwright)** - User flows
   - Dashboard → initiate lend → select contact → select items → confirm
   - Receive borrow request → accept → verify in currently lent view
   - Return item → verify status updates

---

*Testing analysis: 2026-02-07*
