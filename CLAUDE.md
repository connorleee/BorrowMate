# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BorrowMate (BorrowBase) is a contact-centric item lending app designed for simplicity and minimal friction. The core lending flow is intentionally streamlined:

**Core Lending Flow:** Lend something → pick or create contact → pick one or more items → optional due date → confirm.

Users can manage personal and shared inventory, track who borrowed what, and organize loans through contacts. Groups and user follows exist as optional organizational features, not requirements for core lending functionality.

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

### High-Level Flow (Contact-Centric Lending)

The app prioritizes a simple, minimal-friction lending experience:

1. **Initiate Lending** - User taps "Lend" from dashboard
2. **Select or Create Contact** - Search/filter existing contacts or quickly create a new one
3. **Pick Items** - Multi-select from personal inventory (with optional due date)
4. **Confirm** - Review and submit borrow record(s)
5. **Track & Return** - View active loans and mark items as returned when complete

All lending operations center on **contacts**, not groups. Groups remain available for organizing shared inventories or batch operations, but are not required for the core lending flow.

## Database Schema (Supabase)

### Core Tables

**users** - User profiles (mirrors auth.users)
- Auto-populated via trigger on auth.users insert
- Fields: id, name, email, phone, created_at

**contacts** - User's personal lending contacts
- Per-user private table (not shared across users)
- Fields: id, owner_user_id, name, email (nullable), phone (nullable), linked_user_id (nullable FK to users.id), created_at, updated_at
- `linked_user_id` allows linking a contact to an actual BorrowMate user
- RLS: Only visible to owner

**groups** - Household/friend groups (secondary/optional)
- Fields: id, name, description, created_by, privacy ('public'|'private'), invite_code
- RLS: Viewable by members only

**group_memberships** - Users ↔ Groups many-to-many
- Fields: user_id, group_id, role ('owner'|'member')
- Unique constraint on (user_id, group_id)

**items** - Inventory catalog
- Fields: id, group_id (nullable), name, description, category, owner_user_id, visibility ('shared'|'personal'), ownership_type ('owner'|'shared'), status ('available'|'unavailable'), privacy ('public'|'private'), qr_slug (nullable), price_usd, created_at, updated_at
- `group_id = null` means personal item not assigned to group
- `ownership_type` indicates whether user owns or co-owns the item
- `qr_slug` optional for QR/NFC quick-action linking
- RLS: Viewable by owner, group members, or followers (if public)

**borrow_records** - Borrowing transactions (contact-centric)
- Fields: id, item_id, contact_id, group_id (nullable), lender_user_id, borrower_user_id (nullable), start_date, due_date, returned_at, status ('borrowed'|'returned'|'overdue'|'lost'), created_at, updated_at
- `contact_id` (required) - Links to contacts table; core identifier for lending
- `borrower_user_id` (nullable) - If contact is linked to a BorrowMate user
- `group_id` (nullable) - If lending involves a group; primary lending is contact-based
- RLS: Viewable by lender, borrower (if user), or group members (if applicable)

**user_follows** - User following relationships (secondary/optional)
- Fields: follower_id, following_id
- Asymmetric (one-way) follows
- Check constraint prevents self-follows
- Note: Not required for core lending flow; contacts are the primary organizational unit

### RLS (Row-Level Security) Important Notes

**All tables have RLS enabled.** When writing server actions:
- Failed inserts/updates often indicate RLS policy violations
- Check policies in `supabase/migrations/20240101000000_init.sql` and subsequent migrations
- Contacts are per-user private; RLS ensures only owner can access
- Contact-based lending (null group_id) requires proper RLS handling on borrow_records to respect contact ownership

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

**Spacing Hierarchy (use consistently):**
- `gap-4` (16px) - Tightly related elements (form fields, card content)
- `gap-6` (24px) - Related sections within a container
- `gap-8` (32px) - Major page sections
- `gap-12` (48px) - Distinct content blocks on long pages

**Dark Mode Colors (use CSS variables, not hardcoded grays):**
- `bg-base` - Primary background (white/dark)
- `bg-surface` - Cards and elevated surfaces
- `bg-elevated` - Hover states, tertiary surfaces
- `text-text-primary` - Main text
- `text-text-secondary` - Supporting text
- `text-text-tertiary` - Muted/helper text
- `border-border` - All borders

**Form Inputs:**
- Use `p-3` padding consistently
- Include `border border-border rounded bg-base` for proper dark mode support

## Important Gotchas

1. **Server/Client Boundary**: Never import server utilities in client components or vice versa
2. **RLS Violations**: If mutations fail silently, check RLS policies - especially for contact-based lending
3. **Middleware**: Uses `utils/supabase/middleware.ts` for session refresh
4. **Async Server Components**: All server components are async and use `await` for data fetching
5. **Form Actions**: Can pass server actions directly to `action` prop or call imperatively from client components
6. **Next.js 16**: Uses Turbopack in development, be aware of caching behavior

## UI & Product Flows

### Core Lending Flow (3–5 Taps)

1. User initiates "Lend" action
2. Select or create a contact (search, filter, or quick-add)
3. Select one or more items from inventory
4. Optionally set due date
5. Confirm and create borrow record(s)

**Philosophy:** Minimize steps and decision fatigue. Contact selection is always the first choice point.

### Quick Return Flow

- **Currently Lent** view displays active loans grouped by contact
- Single tap to mark item as returned
- System auto-updates status and clears item from "unavailable"

### Multi-Item Lending Sessions

- Select multiple items to lend to same contact in one action
- Each item creates a separate borrow_record
- Due date applies to all items in session (or individually if needed)

### Optional Features

- **Smart Reminders** - Due date notifications; overdue alerts
- **QR/NFC Quick Actions** - `qr_slug` field enables quick item lookup and lending flows
- **Activity Timeline** - Visual history of lending/returns per contact
- **Ownership Badges** - Visually distinguish owned vs. shared items in inventory

## Batch Lending Feature

Core feature for contact-centric lending: Select one contact + multiple items in a single session.

**User Flow:**
- Multi-select UI with checkboxes (uses `Set<string>` state for O(1) lookups)
- Contact search with 300ms debounce
- Optional due date for entire batch (or per-item if needed)
- Confirm to create multiple borrow_records linked to single contact

**Implementation:**
- Creates separate borrow_record for each item, all linked to same contact_id
- Comprehensive error handling with partial success reporting
- Item status updated to 'unavailable' upon successful lending
- Components: `MyInventorySection`, `BatchLendModal`, `LendableItemCard`, `BatchLendButton`
- Server action: `batchLendItems()` in `app/items/actions.ts`
- Always look for ways to DRYify the code. Prioritize using reusable components, logic, etc