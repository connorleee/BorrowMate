# Technology Stack

**Analysis Date:** 2026-02-07

## Languages

**Primary:**
- TypeScript 5 - Application code, all `.ts` and `.tsx` files
- JavaScript - Configuration and scripts
- SQL - Database migrations and queries (PostgreSQL dialect)

**Secondary:**
- CSS - Styling via Tailwind CSS v4 utility classes
- JSX/TSX - React component syntax

## Runtime

**Environment:**
- Node.js 20+ (implied by Next.js 16 compatibility)

**Package Manager:**
- npm - Project uses npm scripts defined in `package.json`
- Lockfile: `package-lock.json` (present but not examined in detail)

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
  - Server Components by default for data fetching
  - Server Actions for mutations (`'use server'` directive)
  - App Router for file-based routing in `app/` directory
  - Middleware at `middleware.ts` for session management

- React 19.2.0 - UI library for component development

**Styling:**
- Tailwind CSS v4 - Utility-first CSS framework
  - Uses `@tailwindcss/postcss` for PostCSS integration
  - Color scheme with CSS variables for dark mode support
  - Spacing hierarchy: gap-4 (16px), gap-6 (24px), gap-8 (32px), gap-12 (48px)
  - Dark mode colors: bg-base, bg-surface, bg-elevated, text-text-primary, text-text-secondary, border-border

**Type Safety:**
- TypeScript - Full type checking at build time
  - Config: `tsconfig.json` with strict mode enabled
  - Target: ES2017
  - Module resolution: bundler
  - Path alias: `@/*` maps to project root

**Testing:**
- No testing framework configured (None detected)

**Build/Dev:**
- Turbopack - Development bundler (Next.js 16 feature)
- TypeScript compiler - Type checking during build via `npm run build`

## Key Dependencies

**Critical:**
- @supabase/ssr 0.7.0 - Server-side rendering utilities for Supabase auth
  - Handles session management via cookies
  - Provides `createServerClient()` and `createBrowserClient()`
  - Used in `utils/supabase/server.ts`, `utils/supabase/client.ts`, `utils/supabase/middleware.ts`

- @supabase/supabase-js 2.84.0 - JavaScript client for Supabase
  - Handles authentication (email/password, OAuth with Google)
  - Database access via realtime subscriptions and REST API
  - Row-level security policy enforcement

**Infrastructure:**
- react-dom 19.2.0 - React DOM rendering
- next 16.1.1 - Next.js framework

**Development:**
- @types/node 20 - Node.js type definitions
- @types/react 19 - React type definitions
- @types/react-dom 19 - React DOM type definitions
- eslint 9 - Linting for code quality
- eslint-config-next 16.0.4 - ESLint configuration for Next.js
- tailwindcss 4 - Tailwind CSS core

## Configuration

**Environment:**
- `.env.local` - Local development environment variables
  - Required vars:
    - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (public)
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public, safe for browser)
    - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase publishable key (alternative auth config)
    - `NEXT_PUBLIC_SITE_URL` - Site URL for OAuth callbacks (optional, defaults to http://localhost:3000)

- Environment variables are NOT committed to git; sensitive keys require `.env.local` setup

**Build:**
- `next.config.ts` - Next.js configuration (minimal, no custom config)
- `tsconfig.json` - TypeScript compilation settings
- `package.json` - Dependencies, scripts, project metadata

**Database:**
- `supabase/migrations/` - SQL migrations (37 files)
  - Migrations are timestamped and applied in order
  - Never modified after creation; new migrations added for changes
  - Applied via `npx supabase db push` or Supabase dashboard
  - Includes schema, RLS policies, triggers, functions, and indexes

## Platform Requirements

**Development:**
- Node.js 20+
- npm (or compatible package manager)
- Docker (optional, for `npx supabase start` - local Supabase instance)
- Git for version control

**Production:**
- Deployment target: Vercel (recommended by Next.js project) or any Node.js hosting
- Supabase project (cloud or self-hosted PostgreSQL)
- HTTPS recommended for OAuth callbacks

---

*Stack analysis: 2026-02-07*
