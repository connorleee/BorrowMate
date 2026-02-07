# Codebase Structure

**Analysis Date:** 2026-02-07

## Directory Layout

```
BorrowMate/
├── app/                        # Next.js App Router pages and server actions
│   ├── layout.tsx              # Root layout with sidebar and theme provider
│   ├── page.tsx                # Landing page (public)
│   ├── globals.css             # Tailwind config with color theme
│   ├── auth/                   # Authentication
│   │   ├── page.tsx            # Login/signup form
│   │   ├── actions.ts          # login(), signup(), signInWithGoogle()
│   │   └── callback/           # OAuth callback handler
│   ├── dashboard/              # Main dashboard
│   │   └── page.tsx            # Shows active loans grouped by contact
│   ├── items/                  # Inventory management
│   │   ├── page.tsx            # User items and batch lend UI
│   │   └── actions.ts          # Item CRUD and batch lending
│   ├── contacts/               # Contact management (lending contacts)
│   │   ├── page.tsx            # Contact list with search
│   │   ├── actions.ts          # Contact CRUD
│   │   └── [id]/               # Contact detail pages
│   ├── borrow/                 # Borrow record management
│   │   ├── page.tsx            # Borrow request UI
│   │   └── actions.ts          # returnItem(), getActiveBorrows()
│   ├── groups/                 # Group (household) management
│   │   ├── page.tsx            # List user's groups
│   │   ├── actions.ts          # Group CRUD and membership
│   │   ├── [id]/               # Group detail pages
│   │   └── join/               # Join group via invite
│   ├── users/                  # User profiles and follows
│   │   ├── actions.ts          # searchUsers(), followUser()
│   │   └── [id]/               # User profile pages
│   ├── notifications/          # Notifications
│   │   └── actions.ts          # getNotifications()
│   ├── discover/               # Discovery/explore features
│   │   └── page.tsx            # Find users/items to borrow
│   └── about/                  # About page
│       └── page.tsx            # Marketing/info page
│
├── components/                 # Client components and UI widgets
│   ├── Sidebar.tsx             # Navigation sidebar (server wrapper)
│   ├── SidebarClientContent.tsx # Client-side sidebar with auth state
│   ├── ThemeProvider.tsx       # Theme context provider
│   ├── ThemeToggle.tsx         # Dark/light mode toggle
│   ├── TopNav.tsx              # Top navigation bar
│   ├── Card.tsx                # Reusable card components (ItemCard, ContactCard, etc.)
│   ├── batch-lend-modal.tsx    # Multi-step modal for batch lending
│   ├── batch-lend-button.tsx   # Button to open batch lend modal
│   ├── my-inventory-section.tsx # Multi-select inventory UI
│   ├── lendable-item-card.tsx  # Card for individual item with lend button
│   ├── item-detail-modal.tsx   # Modal showing item details and history
│   ├── contact-card.tsx        # Card for displaying contact
│   ├── contact-list-section.tsx # Searchable contact list
│   ├── contact-detail-content.tsx # Full contact detail page content
│   ├── add-contact-modal.tsx   # Modal to create new contact
│   ├── add-item-form.tsx       # Form to create new item
│   ├── borrow-request-card.tsx # Card for incoming borrow request
│   ├── borrow-request-modal.tsx # Modal to handle borrow requests
│   ├── lend-to-contact-modal.tsx # Modal to lend single item to contact
│   ├── items-page-content.tsx  # Client wrapper for /items page
│   ├── dashboard-content.tsx   # Client wrapper for /dashboard page
│   ├── add-contact-button.tsx  # Button to open add contact modal
│   ├── invite-user-button.tsx  # Button to invite group member
│   ├── invite-user-modal.tsx   # Modal for sending invites
│   ├── item-selector-modal.tsx # Modal to select items for lending
│   ├── delete-item-button.tsx  # Button to delete item
│   └── notification-bell.tsx   # Notification indicator in header
│
├── context/                    # React Context providers
│   └── ThemeContext.tsx        # Dark mode state and theme resolution
│
├── utils/                      # Shared utilities
│   └── supabase/               # Supabase client setup and middleware
│       ├── server.ts           # Server-side Supabase client (uses cookies)
│       ├── client.ts           # Client-side Supabase client (browser-based)
│       └── middleware.ts       # Session refresh and route protection
│
├── types/                      # TypeScript type definitions
│   └── supabase.ts             # Generated Supabase schema types (Database interface)
│
├── supabase/                   # Supabase configuration and migrations
│   └── migrations/             # SQL migrations (timestamped)
│       ├── 20240101000000_init.sql # Initial schema
│       └── [subsequent migrations]
│
├── public/                     # Static assets
│   └── [images, icons, etc.]
│
├── .planning/                  # GSD planning artifacts
│   └── codebase/              # Analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
│
├── docs/                      # Documentation
├── tasks/                     # Task tracking (todo.md, etc.)
├── prompts/                   # AI prompt templates
│
├── package.json               # NPM dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS configuration (empty, uses globals.css)
├── next.config.ts             # Next.js configuration (minimal)
├── middleware.ts              # Next.js middleware entry point
├── next-env.d.ts              # Generated Next.js type definitions
└── eslint.config.mjs          # ESLint configuration
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router pages and server actions
- Contains: Page components (Server Components by default), route handlers, Server Actions
- Key files: Each directory has `page.tsx` for rendering, `actions.ts` for mutations

**components/:**
- Purpose: Reusable React components (mostly Client Components)
- Contains: UI widgets, modals, cards, forms, interactive sections
- Pattern: Named files in kebab-case (e.g., `batch-lend-modal.tsx`)

**context/:**
- Purpose: React Context providers for global state
- Contains: `ThemeContext` for dark/light mode management
- Pattern: Single file `ThemeContext.tsx` exports provider and hook

**utils/supabase/:**
- Purpose: Supabase client initialization and session management
- Contains: Server client (cookie-based), browser client (auth-token-based), middleware for session refresh
- Critical: `server.ts` used in Server Components/Actions, `client.ts` used only in Client Components

**types/:**
- Purpose: TypeScript type definitions
- Contains: `supabase.ts` with generated Database interface (auto-generated from Supabase schema)
- Auto-generated: Regenerate via `supabase gen types --lang=typescript`

**supabase/:**
- Purpose: Supabase configuration and database migrations
- Contains: Timestamped SQL migration files
- Pattern: Create new migrations via `npx supabase migration new <name>`, apply via `npx supabase db push`

## Key File Locations

**Entry Points:**
- `app/page.tsx`: Public landing page
- `app/layout.tsx`: Root layout (wraps all pages)
- `middleware.ts`: Route protection and session refresh (runs before page code)
- `app/dashboard/page.tsx`: Main authenticated dashboard

**Configuration:**
- `package.json`: Dependencies and dev scripts
- `tsconfig.json`: TypeScript compiler options
- `next.config.ts`: Next.js build options
- `app/globals.css`: Tailwind theme and dark mode setup
- `tailwind.config.ts`: Tailwind configuration (minimal, most config in globals.css)
- `eslint.config.mjs`: ESLint rules

**Core Logic:**
- `app/items/actions.ts`: Item CRUD, batch lending logic
- `app/borrow/actions.ts`: Borrow record creation, return logic, active borrows queries
- `app/contacts/actions.ts`: Contact CRUD, search with debounce
- `app/groups/actions.ts`: Group management, membership
- `app/auth/actions.ts`: Authentication, session management

**Testing:**
- No test files found; testing infrastructure not set up
- No `jest.config.js`, `vitest.config.ts`, or `*.test.ts` files

**Utility Functions:**
- No shared helper utilities directory; logic lives in Server Actions
- Debounce implemented inline in `BatchLendModal` (300ms setTimeout)
- Date formatting done inline in components (`.toLocaleDateString()`)

## Naming Conventions

**Files:**
- Server Actions: `actions.ts` (one per domain directory)
- Pages: `page.tsx` (one per route, required by Next.js)
- Client Components: kebab-case (e.g., `batch-lend-modal.tsx`, `add-item-form.tsx`)
- Server Components: PascalCase (e.g., `Sidebar.tsx`, `ThemeProvider.tsx`)
- Utility files: kebab-case (e.g., `server.ts`, `client.ts` in supabase/)

**Directories:**
- Route directories: lowercase, match URL paths (e.g., `/dashboard`, `/items`, `/contacts`)
- Dynamic routes: brackets (e.g., `[id]`, `[contactId]`)
- Functional grouping: lowercase domain names (e.g., `utils/supabase/`)

**TypeScript/React:**
- Components: PascalCase (exported as default)
- Functions: camelCase (export named or default)
- Types/Interfaces: PascalCase (e.g., `BatchLendModalProps`, `BorrowRecord`)
- Constants: UPPER_SNAKE_CASE for significant constants (not heavily used in codebase)
- CSS classes: Tailwind utility classes (no custom CSS selectors found; all styling via Tailwind)

## Where to Add New Code

**New Feature (Contact-centric Lending Example):**
- Primary logic: `app/contacts/actions.ts` for CRUD, `app/borrow/actions.ts` for lending operations
- UI: Create new component in `components/` (e.g., `components/contact-search.tsx`)
- Page: Add route directory `app/contacts/`, create `page.tsx` and optionally `actions.ts`
- Tests: Create `*.test.ts` or `*.spec.ts` co-located with source (no test infrastructure yet)

**New Page/Route:**
1. Create directory in `app/` matching URL (e.g., `app/my-route/`)
2. Create `page.tsx` as Server Component if data-driven, or Client Component if interactive
3. Extract interactive portions to `components/` if reusable
4. Create `actions.ts` in route directory if mutations needed
5. Add navigation link in `components/Sidebar.tsx` or `components/TopNav.tsx`

**New Component/Modal:**
- Location: `components/` directory
- File: Use kebab-case file name matching component purpose (e.g., `search-contacts-modal.tsx`)
- Pattern: Export as default React component; use `'use client'` for interactivity
- Portal modals: Import `createPortal` from `react-dom`, render to `document.body`, null-check for SSR safety

**Utilities/Helpers:**
- Shared utilities: Add to `utils/` in appropriately named file (e.g., `utils/formatting.ts`)
- Supabase integration: Extend `utils/supabase/` client files (rarely needed; use Server Actions instead)
- No barrel exports yet; consider adding `components/index.ts` for frequently imported components

**Database Changes:**
1. Create migration: `npx supabase migration new <descriptive_name>`
2. Write SQL in `supabase/migrations/<timestamp>_<name>.sql`
3. Apply locally: `npx supabase db push`
4. Update types: `supabase gen types --lang=typescript > types/supabase.ts`
5. Reference generated types in `app/*/actions.ts` and components

## Special Directories

**node_modules/:**
- Purpose: NPM package dependencies
- Generated: Installed via `npm install`
- Committed: No (in .gitignore)
- Size: ~500+ MB; contains React, Next.js, Tailwind, Supabase client libraries

**.next/:**
- Purpose: Next.js build output and internal cache
- Generated: Created during `npm run build` or `npm run dev`
- Committed: No (in .gitignore)
- Note: Rebuild required after environment changes

**.planning/codebase/:**
- Purpose: GSD (Get Stuff Done) codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md
- Committed: Yes; updated by orchestrator tools to guide implementation

**supabase/.temp/:**
- Purpose: Temporary Supabase CLI state and internal files
- Generated: Created by `npx supabase start`
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-02-07*
