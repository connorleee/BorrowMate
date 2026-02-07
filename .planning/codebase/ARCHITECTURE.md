# Architecture

**Analysis Date:** 2026-02-07

## Pattern Overview

**Overall:** Next.js 16 App Router with Server Components + Server Actions

**Key Characteristics:**
- Server Components handle data fetching and rendering (default in App Router)
- Server Actions (`'use server'`) handle all mutations and database operations
- Client Components (`'use client'`) manage interactive UI state with React hooks
- Supabase PostgreSQL with Row-Level Security (RLS) for data access control
- Contact-centric lending model: loans are organized around contacts, not groups (groups are optional)

## Layers

**Presentation Layer:**
- Location: `components/` and page components in `app/*/page.tsx`
- Contains: Client Components with interactive UI, Server Components for data rendering
- Pattern: Components call Server Actions imperatively or via form actions
- Dark mode support via CSS variables and `ThemeContext` in `context/ThemeContext.tsx`

**Server Actions Layer:**
- Location: `app/*/actions.ts` files, organized by domain (items, contacts, borrow, groups, users, auth, notifications)
- Contains: All mutations, complex queries, authentication checks
- Pattern: Each action checks authentication, performs DB operation via Supabase client, then revalidates affected paths
- Examples: `batchLendToContact()` in `app/borrow/actions.ts`, `createContact()` in `app/contacts/actions.ts`

**Database Access Layer:**
- Location: `utils/supabase/server.ts` (Server Components/Actions) and `utils/supabase/client.ts` (Client Components)
- Contains: Supabase client initialization with cookie-based auth (SSR pattern)
- Pattern: Server-side uses cookies via `@supabase/ssr` for session persistence, client-side uses browser auth

**Authentication & Session Layer:**
- Location: `utils/supabase/middleware.ts` and `middleware.ts` at root
- Contains: Session refresh logic, route protection, cookie management
- Pattern: Middleware intercepts all requests to refresh Supabase session; protects all routes except `/`, `/auth`, public pages

**Database Layer:**
- Location: Supabase PostgreSQL with migrations in `supabase/migrations/`
- Tables: `users`, `contacts`, `groups`, `group_memberships`, `items`, `borrow_records`, `user_follows`
- RLS Policies: Enable row-level security on all tables; contacts are per-user private, items visibility varies by privacy/group membership

## Data Flow

**Contact-Centric Lending Flow:**

1. User navigates to `/items` (Server Component `app/items/page.tsx`)
2. Server Component calls `getUserItems()` and `getBorrowedItems()` Server Actions
3. Data passed to Client Component `ItemsPageContent` which renders inventory
4. User selects items and enters "Batch Lend" mode via `MyInventorySection` (Client Component)
5. `BatchLendModal` (Client Component) opens, user searches/creates contact via `searchContacts()` and `createContact()` Server Actions
6. User clicks "Lend" button, triggering `batchLendToContact()` Server Action
7. Server Action creates multiple `borrow_records` (one per item) linked to single contact
8. Server Action updates item statuses to 'unavailable' and revalidates cache
9. UI refreshes automatically via Next.js revalidation

**Borrow Record Retrieval Flow:**

1. Dashboard page (`app/dashboard/page.tsx`) fetches via `getActiveBorrowsGroupedByContact()`
2. Server Action queries `borrow_records` with relational joins to `items`, `contacts`, and `users`
3. Data returned to Client Component `DashboardContent` for rendering
4. User marks item as returned via button, calling `returnBorrowRecord()` Server Action
5. Server Action updates `borrow_records.status` and `items.status`, revalidates dashboard

**State Management:**

- **Server State:** Supabase database (source of truth); revalidated via `revalidatePath()` after mutations
- **Client State:** React hooks in Client Components (e.g., `selectedItems` Set in `MyInventorySection`)
- **Session State:** Supabase auth session managed via cookies (persisted across requests via middleware)
- **Theme State:** `ThemeContext` manages light/dark mode preference (stored in localStorage)

## Key Abstractions

**Server Actions by Domain:**

- `app/items/actions.ts`: `createItem()`, `getUserItems()`, `getItemDetails()`, `deleteItem()`, `getBorrowedItems()`, `batchLendToContact()`
- `app/contacts/actions.ts`: `createContact()`, `searchContacts()`, `getContacts()`, `updateContact()`, `deleteContact()`
- `app/borrow/actions.ts`: `borrowItem()`, `returnItem()`, `getActiveBorrows()`, `getActiveBorrowsGroupedByContact()`, `markItemAsLost()`
- `app/groups/actions.ts`: `createGroup()`, `getUserGroups()`, `joinGroup()`, `leaveGroup()`, `addGroupMember()`, `removeGroupMember()`
- `app/users/actions.ts`: `searchUsers()`, `followUser()`, `unfollowUser()`
- `app/auth/actions.ts`: `login()`, `signup()`, `logout()`, `signInWithGoogle()`
- `app/notifications/actions.ts`: `getNotifications()`, `markAsRead()`

**Portal-Based Modals:**

- `BatchLendModal` in `components/batch-lend-modal.tsx`: Multi-step modal for lending items to contact
- `ItemDetailModal` in `components/item-detail-modal.tsx`: Shows item details and borrowing history
- `BorrowRequestModal` in `components/borrow-request-modal.tsx`: Handles incoming borrow requests
- `AddContactModal` in `components/add-contact-modal.tsx`: Quick contact creation
- Pattern: Use `createPortal()` to render to `document.body` with null checks for server safety

**Batch Lending:**

- `MyInventorySection` (Client Component): Manages multi-select UI with `Set<string>` for O(1) lookups
- `BatchLendButton`: Triggers batch lend modal on click
- `batchLendToContact()` (Server Action): Creates multiple `borrow_records` atomically, updates item statuses, returns success/error with details
- Pattern: Comprehensive error handling with partial success reporting (some items succeed, some fail)

**Multi-Select UI Pattern:**

- `MyInventorySection` uses `Set<string>` to track selected item IDs (not array for performance)
- `toggleItemSelection(itemId)` adds/removes from set
- `selectedItems.size` for count, `selectedItems.has(id)` for checked state
- Clears selection on mode toggle or successful lend

**Debounced Search Pattern:**

- `BatchLendModal` implements 300ms debounce on contact search
- Uses `setTimeout` with cleanup in `useEffect` dependency array
- Only triggers search if query length >= 2 characters

## Entry Points

**Web Application:**
- Location: `app/page.tsx` (landing page with marketing copy)
- Purpose: Public landing page; redirects to dashboard if logged in
- Unauthenticated: Shows hero, feature cards, CTA buttons to login/signup

**Authenticated Routes:**
- `/dashboard` (`app/dashboard/page.tsx`): Main hub; shows active loans grouped by contact, items borrowed from others
- `/items` (`app/items/page.tsx`): User inventory; multi-select lend UI, add items form, borrowed items tab
- `/contacts` (`app/contacts/page.tsx`): List of lending contacts; search, quick-add
- `/groups` (`app/groups/page.tsx`): List of shared inventory groups
- `/auth` (`app/auth/page.tsx`): Login/signup form with Google OAuth

**Protected Routes:**
- Middleware (`utils/supabase/middleware.ts`) redirects unauthenticated users to `/auth` except `/`, `/auth`, `/about`
- All Server Components check `supabase.auth.getUser()` before fetching data

## Error Handling

**Strategy:** Synchronous error returns from Server Actions + UI-level display

**Patterns:**

- Server Actions return `{ error: string }` on failure or `{ success: true, data?: ... }` on success
- Client Components check `result.error` and display error toast/message
- Example in `MyInventorySection.handleLendItems()`:
  ```typescript
  const result = await batchLendToContact(itemIds, contactId, dueDate)
  if (result.error) {
    setFeedbackMessage({ type: 'error', text: result.error })
    return
  }
  ```

- Supabase RLS violations return opaque "policy evaluation failed" errors; logged to console with context
- Redirect failures (e.g., after mutation) throw error that bubbles to error boundary (if implemented)
- Database constraint violations returned as-is from Supabase

## Cross-Cutting Concerns

**Logging:** Console.error/log in Server Actions for debugging; no centralized logging library
- Examples: `console.error('Error creating item:', error)` in `createItem()`

**Validation:**
- Client-side: HTML5 form validation (required, type, minLength) in auth/contact/item forms
- Server-side: Parameter type checking via FormData.get() casts; no schema validation library
- Example: `const name = formData.get('name') as string` assumes non-null

**Authentication:**
- Supabase Auth handles credential storage and session management
- Each Server Action checks `supabase.auth.getUser()` to enforce access control
- Redirect to `/auth` on auth failure (handled in Server Components and middleware)

**Cache Invalidation:**
- `revalidatePath()` after mutations to refresh server-cached data
- Example: After `batchLendToContact()`, call `revalidatePath('/items')` to refresh inventory view
- Scope: Path-level or layout-level revalidation; no granular cache keys

---

*Architecture analysis: 2026-02-07*
