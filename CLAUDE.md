# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BorrowMate is a Next.js application for tracking shared inventory and borrowing among roommates and friend groups. Users can catalog items (personal or shared), manage groups, track who borrowed what, and follow other users to lend items outside of group contexts.

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL with RLS)
- @supabase/ssr for authentication

## Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Build & Production
npm run build            # Production build (runs TypeScript checks)
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint

# Supabase (requires Docker)
npx supabase start       # Start local Supabase
npx supabase db push     # Apply migrations to local DB
npx supabase db reset    # Reset local DB and reapply all migrations
```

## Architecture

### Next.js App Router Structure

- **Server Components** (default): Pages in `app/*/page.tsx` are server components that handle data fetching
- **Client Components** (`'use client'`): Interactive components in `/components` directory
- **Server Actions** (`'use server'`): Database mutations in `app/*/actions.ts` files

### Data Flow Pattern

1. **Server Components** fetch data using Supabase server client (`utils/supabase/server.ts`)
2. **Server Actions** handle mutations and call `revalidatePath()` to refresh data
3. **Client Components** call server actions via form actions or imperative calls
4. Authentication state managed via Supabase SSR cookies

### Key Architectural Patterns

**Server vs Client Supabase Clients:**
- `utils/supabase/server.ts` - Use in Server Components and Server Actions (uses cookies)
- `utils/supabase/client.ts` - Use in Client Components (browser-based)
- Never mix these - Server Components cannot use client, Client Components cannot use server

**Server Actions by Domain:**
- `app/items/actions.ts` - Item CRUD, batch lending
- `app/groups/actions.ts` - Group management, memberships, invites
- `app/borrow/actions.ts` - Borrow record creation/returns
- `app/users/actions.ts` - User follows, search
- `app/auth/actions.ts` - Authentication

**Component Patterns:**
- Components using `createPortal` must check `document` availability (server-safe)
- Modal components render to `document.body` via portal
- Multi-select uses `Set<string>` for O(1) lookups
- Debounced search uses `setTimeout` with cleanup in `useEffect`

## Database Schema (Supabase)

### Core Tables

**users** - User profiles (mirrors auth.users)
- Auto-populated via trigger on auth.users insert
- Fields: id, name, email, phone, created_at

**groups** - Household/friend groups
- Fields: id, name, description, created_by, privacy ('public'|'private'), invite_code
- RLS: Viewable by members only

**group_memberships** - Users ↔ Groups many-to-many
- Fields: user_id, group_id, role ('owner'|'member')
- Unique constraint on (user_id, group_id)

**items** - Inventory catalog
- Fields: id, group_id (nullable), name, description, category, owner_user_id, visibility ('shared'|'personal'), status ('available'|'unavailable'), privacy ('public'|'private'), price_usd
- `group_id = null` means personal item not assigned to group
- RLS: Viewable by group members OR owner OR followers (if public)

**borrow_records** - Borrowing transactions
- Fields: item_id, group_id (nullable), lender_user_id, borrower_user_id (nullable), borrower_name (for external borrowers), start_date, due_date, returned_at, status ('borrowed'|'returned'|'overdue')
- `group_id = null` for personal item lending
- RLS: Viewable by lender, borrower, or group members

**user_follows** - User following relationships
- Fields: follower_id, following_id
- Asymmetric (one-way) follows
- Check constraint prevents self-follows

### RLS (Row-Level Security) Important Notes

**All tables have RLS enabled.** When writing server actions:
- Failed inserts/updates often indicate RLS policy violations
- Check policies in `supabase/migrations/20240101000000_init.sql` and subsequent migrations
- Personal items (null group_id) require special RLS handling added in migration `20250128170000_make_borrow_records_group_nullable.sql`

### Migration Workflow

Migrations in `supabase/migrations/` are timestamped and applied in order:
- `20240101000000_init.sql` - Initial schema
- Subsequent migrations add features (user follows, nullable fields, RLS fixes, etc.)
- Always create new migrations, never modify existing ones
- Apply via `npx supabase db push` or manually in Supabase dashboard SQL editor

## Common Patterns & Best Practices

### Server Actions

```typescript
'use server'

export async function myAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Perform operation
  const { data, error } = await supabase.from('table').insert({...})

  if (error) return { error: error.message }

  // Revalidate affected paths
  revalidatePath('/path')
  return { success: true }
}
```

### Authentication Checks

Always check authentication in server actions and protected pages:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth')
```

### Portal-Based Modals

```typescript
'use client'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen }) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 ...">
      {/* Modal content */}
    </div>,
    document.body
  )
}
```

### Styling Conventions

- Tailwind CSS v4 (uses `@tailwindcss/postcss`)
- Color scheme defined in `globals.css`
- Consistent badge colors: green (success/available), red (error/unavailable), yellow (warning/pending), blue (primary actions), gray (secondary)
- Responsive: mobile-first with `md:` breakpoints

## Important Gotchas

1. **Server/Client Boundary**: Never import server utilities in client components or vice versa
2. **RLS Violations**: If mutations fail silently, check RLS policies - especially for null group_id scenarios
3. **Middleware**: Uses `utils/supabase/middleware.ts` for session refresh
4. **Async Server Components**: All server components are async and use `await` for data fetching
5. **Form Actions**: Can pass server actions directly to `action` prop or call imperatively from client components
6. **Next.js 16**: Uses Turbopack in development, be aware of caching behavior

## Batch Lending Feature

Recently added feature allowing users to lend multiple personal items to followers or group members:
- Multi-select UI with checkboxes (uses `Set<string>` state)
- Recipient search with 300ms debounce
- Creates borrow_records with `group_id = null`
- Comprehensive error handling with partial success reporting
- Components: `MyInventorySection`, `BatchLendModal`, `LendableItemCard`, `BatchLendButton`
- Server action: `batchLendItems()` in `app/items/actions.ts`
