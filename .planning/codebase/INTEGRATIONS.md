# External Integrations

**Analysis Date:** 2026-02-07

## APIs & External Services

**Supabase (Backend-as-a-Service):**
- Service: Supabase (PostgreSQL database + authentication + realtime)
- What it's used for:
  - User authentication (email/password and OAuth)
  - Data persistence for all core tables
  - Row-level security policy enforcement
  - Realtime subscriptions (if configured)
- SDK/Client: `@supabase/supabase-js` (v2.84.0) + `@supabase/ssr` (v0.7.0)
- Auth Provider: Supabase built-in auth (email/password) + Google OAuth
- Implementation files:
  - `utils/supabase/server.ts` - Server-side Supabase client creation
  - `utils/supabase/client.ts` - Browser-side Supabase client creation
  - `utils/supabase/middleware.ts` - Session refresh middleware
  - `app/auth/actions.ts` - Authentication server actions
  - `app/auth/callback/route.ts` - OAuth callback handler

**Google OAuth:**
- Provider: Google Cloud (OAuth 2.0)
- What it's used for: User sign-in via Google account
- Callback URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`
- Implementation: `signInWithGoogle()` in `app/auth/actions.ts`
- Configuration: Managed via Supabase dashboard (Google OAuth app setup)

## Data Storage

**Database:**
- Type/Provider: PostgreSQL (via Supabase)
- Connection: Via `@supabase/supabase-js` client
  - URL: `process.env.NEXT_PUBLIC_SUPABASE_URL`
  - Key: `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ORM/Client: None - raw Supabase REST API queries via `@supabase/supabase-js`

**Core Tables:**
- `users` - User profiles (mirrors auth.users)
- `contacts` - User's personal lending contacts (per-user private)
- `groups` - Household/friend groups (optional organizational feature)
- `group_memberships` - Users ↔ Groups many-to-many relationships
- `items` - Inventory catalog (personal or group-owned)
- `borrow_records` - Borrowing transactions (contact-centric)
- `borrow_requests` - Pending borrow requests awaiting owner approval
- `user_follows` - User following relationships (optional, asymmetric)

**File Storage:**
- Local filesystem only - No external file storage service configured
- Images/attachments not currently implemented in schema

**Caching:**
- Next.js built-in caching via `revalidatePath()` after server actions
- No external caching service (Redis, Memcached) configured

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built on PostgreSQL with JWT tokens)

**Implementation:**
- Email/password sign-up and login
- OAuth 2.0 with Google
- Session management via HTTP-only cookies (secure by default)
- Middleware at `middleware.ts` refreshes session on each request
- All protected routes check authentication with `getUser()` from Supabase

**Session Handling:**
- Cookies stored securely via `@supabase/ssr` utilities
- Middleware refreshes JWT tokens automatically
- Server actions access authenticated user via `supabase.auth.getUser()`
- Protected pages redirect to `/auth` if no user detected

**Implementation Files:**
- `app/auth/page.tsx` - Login/signup form
- `app/auth/actions.ts` - `login()`, `signup()`, `logout()`, `signInWithGoogle()`
- `app/auth/callback/route.ts` - OAuth callback that exchanges code for session
- `utils/supabase/middleware.ts` - Refresh session and protect routes
- `middleware.ts` - Entry point for session middleware

## Monitoring & Observability

**Error Tracking:**
- None detected - No external error tracking service (Sentry, DataDog, etc.)
- Console logging in auth actions (`console.error()`)

**Logs:**
- Console output only (Node.js stdout/stderr)
- Application logs visible during `npm run dev` and in production logs if using Vercel

## CI/CD & Deployment

**Hosting:**
- Target: Vercel (recommended and optimized for Next.js)
- Alternative: Any Node.js hosting (AWS, Heroku, Railway, etc.)

**CI Pipeline:**
- None detected - No GitHub Actions, GitLab CI, or other CI service configured
- Manual deployment via `git push` to Vercel or manual build/start

**Build Command:**
```bash
npm run build        # Runs TypeScript checks and Next.js build
```

**Production Server:**
```bash
npm start            # Starts Next.js production server on port 3000
```

## Environment Configuration

**Required Environment Variables:**

Development (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[publishable-key]
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

Production (via Vercel or hosting platform):
```
NEXT_PUBLIC_SUPABASE_URL=[production-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[production-publishable-key]
NEXT_PUBLIC_SITE_URL=[production-domain]  # For OAuth redirects
```

**Secrets Location:**
- Local: `.env.local` (git-ignored)
- Production: Vercel Environment Variables (dashboard or `vercel env` CLI)
- Never commit `.env.local` or secrets to version control

**Note on Key Visibility:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys)
- The anon key is public but has RLS policies enforcing data access
- Never put service role keys in `NEXT_PUBLIC_*` variables

## Webhooks & Callbacks

**Incoming:**
- `app/auth/callback/route.ts` - OAuth callback for Google sign-in
  - Receives `code` parameter from Google
  - Exchanges code for session via `supabase.auth.exchangeCodeForSession()`
  - Redirects to `/dashboard` or `next` parameter on success

**Outgoing:**
- None detected - No webhooks sent to external services
- Supabase auth events available but not subscribed to
- Future notifications/webhooks could be implemented via Supabase edge functions

## Database Migrations

**Location:** `supabase/migrations/` (37 timestamped SQL files)

**Workflow:**
1. Create new migration: `npx supabase migration new [name]`
2. Write SQL in migration file
3. Apply locally: `npx supabase db push`
4. Push to production: `npx supabase db push --linked` (for Supabase CLI connected projects)
5. Deploy via Vercel: Migrations run automatically if using Supabase integration

**Key Migrations:**
- Initial schema with users, groups, items, borrow_records
- Contacts table for contact-centric lending
- Borrow requests table for pending requests
- User follows for discovering public items
- RLS (Row-Level Security) policies throughout
- Invite codes for group sharing
- Privacy settings (public/private items and groups)

---

*Integration audit: 2026-02-07*
