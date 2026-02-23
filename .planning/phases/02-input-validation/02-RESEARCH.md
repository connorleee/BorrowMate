# Phase 2: Input Validation - Research

**Researched:** 2026-02-22
**Domain:** Server action input validation, type-safe actions, auth middleware
**Confidence:** HIGH

## Summary

This phase adds Zod schema validation and next-safe-action to all server action mutations in BorrowMate. The codebase currently has 7 action files with ~40 exported functions (roughly half mutations, half queries). Mutations currently accept raw `FormData` or unvalidated TypeScript arguments and rely on Supabase to catch bad data at the database level, meaning users see cryptic DB errors instead of helpful validation messages.

The standard approach is: (1) define Zod schemas for each mutation's inputs, (2) configure a next-safe-action client with auth middleware so every protected action gets automatic auth checks, and (3) migrate each mutation to use `actionClient.inputSchema(schema).action()` instead of raw function exports. Query actions (read-only fetches) do NOT need migration since they return empty results on bad input and have no mutation risk.

**Primary recommendation:** Use next-safe-action v8 with Zod (v3.x -- the version already compatible with the ecosystem, no need for v4 migration) to wrap all mutation server actions. Create two action clients: a base `actionClient` for public actions (login/signup) and an `authActionClient` with Supabase auth middleware for all protected mutations. Define schemas in colocated files alongside each action file.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VAL-01 | Zod schemas defined for all server action inputs (items, contacts, borrow, groups, users, auth, notifications) | Zod schema definitions per domain; ~20 mutation actions need schemas across 7 files |
| VAL-02 | next-safe-action client configured with auth middleware pattern | next-safe-action v8 `createSafeActionClient()` with `.use()` middleware for Supabase `getUser()` auth check |
| VAL-03 | All mutation server actions migrated to use Zod-validated inputs via next-safe-action | Each mutation switches from raw `FormData`/args to `actionClient.inputSchema(schema).action()` pattern |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | ^3.23 | Schema validation | Industry standard for TypeScript validation; Standard Schema compliant; required by next-safe-action |
| next-safe-action | ^8.0 | Type-safe server action wrapper | Provides middleware chain, input validation, and type-safe error handling for Next.js App Router actions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | - | next-safe-action + zod cover the full validation stack |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-safe-action | Manual Zod `.parse()` in each action | Works but no middleware chain, no centralized auth, more boilerplate, no typed error structure |
| next-safe-action | zsa (Zod Server Actions) | Newer, less adoption, next-safe-action is more established with better docs |
| Zod v3 | Zod v4 | v4 is faster but introduces migration complexity; v3 is stable and fully compatible with next-safe-action v8 via Standard Schema |

**Installation:**
```bash
npm install zod next-safe-action
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
  safe-action.ts          # Action client definitions (base + auth)
app/
  items/
    actions.ts            # Server actions using actionClient/authActionClient
    schemas.ts            # Zod schemas for items domain
  contacts/
    actions.ts
    schemas.ts
  borrow/
    actions.ts
    schemas.ts
  groups/
    actions.ts
    schemas.ts
  auth/
    actions.ts
    schemas.ts
  notifications/
    actions.ts
    schemas.ts
  users/
    actions.ts
    schemas.ts
```

### Pattern 1: Action Client with Auth Middleware
**What:** Two action clients -- one base, one with auth middleware
**When to use:** Every server action goes through one of these clients

```typescript
// lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/utils/supabase/server";

// Base client for public actions (login, signup)
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    // Log error server-side, return safe message to client
    console.error("Action error:", e.message);
    return e.message;
  },
});

// Auth client for protected actions -- automatically checks auth
export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return next({
    ctx: { user, supabase },
  });
});
```

### Pattern 2: Colocated Schema Definitions
**What:** Zod schemas defined in `schemas.ts` files next to their actions
**When to use:** Every domain that has mutation actions

```typescript
// app/items/schemas.ts
import { z } from "zod";

export const createItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(255),
  description: z.string().max(1000).optional().default(""),
  category: z.string().max(100).optional().default(""),
  privacy: z.enum(["private", "public"]).default("private"),
  groupId: z.string().uuid().nullable().optional(),
});

export const updateItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  price_usd: z.number().min(0).optional(),
});

export const deleteItemSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
});
```

### Pattern 3: Migrated Server Action
**What:** Server action using next-safe-action instead of raw FormData
**When to use:** Every mutation action

```typescript
// app/items/actions.ts (AFTER migration)
"use server";

import { authActionClient } from "@/lib/safe-action";
import { createItemSchema } from "./schemas";
import { revalidatePath } from "next/cache";

export const createItem = authActionClient
  .inputSchema(createItemSchema)
  .action(async ({ parsedInput, ctx: { user, supabase } }) => {
    const { name, description, category, privacy, groupId } = parsedInput;

    const { data, error } = await supabase
      .from("items")
      .insert({
        group_id: groupId || null,
        name,
        description,
        category,
        privacy,
        owner_user_id: user.id,
      })
      .select();

    if (error) {
      throw new Error(error.message);
    }

    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    revalidatePath("/items");
    return { success: true };
  });
```

### Pattern 4: Client-Side Calling Pattern Change
**What:** Client components switch from `action(formData)` to direct calls with objects
**When to use:** Every component that calls a mutation action

```typescript
// BEFORE (raw FormData)
const result = await createItem(formData);

// AFTER (next-safe-action typed object)
const result = await createItem({
  name: formData.get("name") as string,
  description: formData.get("description") as string,
  category: formData.get("category") as string,
  privacy: formData.get("privacy") as string,
});
// result has typed shape: { data?, serverError?, validationErrors? }
```

### Anti-Patterns to Avoid
- **Validating inside the action body:** Zod validation should happen via `inputSchema()`, not manual `.parse()` calls inside the action function. The middleware handles it.
- **Passing Supabase client from ctx AND creating a new one:** The auth middleware creates the client -- use `ctx.supabase`, do not call `createClient()` again inside the action.
- **Migrating query actions:** Read-only fetch actions (getUserItems, getContacts, etc.) do NOT need next-safe-action wrapping. They return empty arrays on failure and have no mutation risk.
- **Over-validating UUIDs on query parameters:** Simple string params on read-only functions are fine as-is. Focus validation effort on mutations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Input validation | Manual if/else checks per field | Zod schemas via `inputSchema()` | Zod handles type coercion, nested objects, error messages, and edge cases |
| Auth middleware | Copy-paste `getUser()` check in every action | next-safe-action `.use()` middleware | Single definition, automatic for all actions using `authActionClient` |
| Validation error formatting | Custom error object shapes | `flattenValidationErrors` from next-safe-action | Consistent error shape across all actions, typed on client |
| Action type safety | Manual TypeScript generics | next-safe-action's inferred types | End-to-end type safety from schema to client result |

**Key insight:** The current codebase has ~20 mutation actions each with hand-rolled auth checks and no input validation. next-safe-action's middleware eliminates the duplicated auth boilerplate AND adds validation in a single migration.

## Common Pitfalls

### Pitfall 1: FormData to Object Migration Breaking Form Submissions
**What goes wrong:** Forms using `action={serverAction}` with FormData stop working because next-safe-action expects typed objects, not FormData.
**Why it happens:** Next.js form actions natively pass FormData. next-safe-action actions expect parsed objects.
**How to avoid:** Change client components to extract form values and pass as objects. Or use next-safe-action's FormData support (not recommended -- typed objects are cleaner).
**Warning signs:** Forms submit but actions receive undefined for all fields.

### Pitfall 2: Forgetting to Pass Supabase Client Through Context
**What goes wrong:** Action creates a second Supabase client instead of using the one from middleware context.
**Why it happens:** Copy-paste from old action code that called `createClient()`.
**How to avoid:** Always destructure `ctx.supabase` from the action parameters. Remove all `createClient()` calls inside migrated actions.
**Warning signs:** Double cookie reads, slightly slower actions.

### Pitfall 3: Returning Errors vs Throwing Errors
**What goes wrong:** Action returns `{ error: "message" }` but client expects `serverError` from next-safe-action.
**Why it happens:** Old pattern was `return { error: msg }`. next-safe-action uses `throw new Error(msg)` for server errors and `returnValidationErrors()` for validation errors.
**How to avoid:** Use `throw` for unexpected server errors. Use `returnValidationErrors(schema, errors)` for business logic validation (e.g., "email already taken"). Return data objects for success cases.
**Warning signs:** Client-side result object has `data.error` instead of `serverError`.

### Pitfall 4: Migrating All Actions at Once
**What goes wrong:** Breaking many components simultaneously makes debugging impossible.
**Why it happens:** Temptation to migrate everything in one pass.
**How to avoid:** Migrate one domain at a time (auth first, then items, etc.). Verify each domain works before moving to the next.
**Warning signs:** Multiple unrelated components break after a single change.

### Pitfall 5: next-safe-action Result Shape on Client
**What goes wrong:** Client code checks `result.success` but next-safe-action returns `result.data`.
**Why it happens:** Old actions returned `{ success: true }` or `{ error: msg }`. next-safe-action wraps results in `{ data?, serverError?, validationErrors? }`.
**How to avoid:** Update all client-side result handling to use next-safe-action's shape. Check `result?.data` for success, `result?.serverError` for errors, `result?.validationErrors` for field errors.
**Warning signs:** Success cases don't trigger UI updates; error cases show no feedback.

## Code Examples

### Complete Auth Action Client (verified from official docs + Supabase pattern)
```typescript
// lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { createClient } from "@/utils/supabase/server";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    return e.message;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return next({ ctx: { user, supabase } });
});
```

### Auth Action (login -- uses base actionClient, NOT authActionClient)
```typescript
// app/auth/actions.ts
"use server";
import { actionClient } from "@/lib/safe-action";
import { loginSchema } from "./schemas";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const login = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  });
```

### Schema with Validation Error Messages
```typescript
// app/auth/schemas.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
```

### Client Component Calling Pattern
```typescript
// components/add-item-form.tsx (AFTER migration)
"use client";
import { createItem } from "@/app/items/actions";

export default function AddItemForm({ groupId }: { groupId?: string }) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const result = await createItem({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || "",
      category: (formData.get("category") as string) || "",
      privacy: (formData.get("privacy") as "private" | "public") || "private",
      groupId: groupId || null,
    });

    if (result?.serverError) {
      // Show error to user
      alert(result.serverError);
      return;
    }

    if (result?.validationErrors) {
      // Show field-specific errors
      // result.validationErrors has shape matching the Zod schema
      return;
    }

    // Success case
    // result.data contains the return value
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Inventory of Mutation Actions (Must Migrate)

These are the actions that need Zod schemas and next-safe-action wrapping:

| File | Action | Current Input | Notes |
|------|--------|---------------|-------|
| auth/actions.ts | `login` | FormData (email, password) | Use base `actionClient` (no auth) |
| auth/actions.ts | `signup` | FormData (name, email, password) | Use base `actionClient` (no auth) |
| auth/actions.ts | `logout` | None | Simple, no input needed -- just wrap with authActionClient |
| auth/actions.ts | `signInWithGoogle` | FormData (unused) | OAuth redirect -- minimal validation needed |
| items/actions.ts | `createItem` | FormData | Auth required |
| items/actions.ts | `deleteItem` | string (itemId) | Auth required |
| items/actions.ts | `updateItem` | string + object | Auth required |
| contacts/actions.ts | `createContact` | FormData | Auth required |
| contacts/actions.ts | `updateContact` | string + FormData | Auth required |
| contacts/actions.ts | `deleteContact` | string | Auth required |
| contacts/actions.ts | `linkContactToUser` | string, string | Auth required |
| borrow/actions.ts | `borrowItem` | FormData | Auth required |
| borrow/actions.ts | `returnItem` | string, string, string | Auth required |
| borrow/actions.ts | `batchLendToContact` | string[], string, string? | Auth required |
| borrow/actions.ts | `createBorrowRequest` | string, string, string?, string? | Auth required |
| borrow/actions.ts | `acceptBorrowRequest` | string | Auth required |
| borrow/actions.ts | `rejectBorrowRequest` | string, string? | Auth required |
| borrow/actions.ts | `getOrCreateContactForGroupMember` | string, string?, string? | Auth required |
| groups/actions.ts | `createGroup` | FormData | Auth required |
| groups/actions.ts | `joinGroupByInviteCode` | string | Auth required |
| groups/actions.ts | `regenerateInviteCode` | string | Auth required |
| groups/actions.ts | `addItemsToGroup` | string, string[] | Auth required |
| groups/actions.ts | `addMembers` | string, string[] | Auth required |
| notifications/actions.ts | `markNotificationAsRead` | string | Auth required |
| notifications/actions.ts | `markAllNotificationsAsRead` | None | Auth required |
| notifications/actions.ts | `dismissNotification` | string | Auth required |
| notifications/actions.ts | `dismissAllNotifications` | None | Auth required |

**Total: 27 mutation actions to migrate** (25 use authActionClient, 2 use base actionClient)

## Query Actions (Do NOT Migrate)

These read-only actions return empty results on failure and need no validation:

| File | Action |
|------|--------|
| items/actions.ts | getGroupItems, getItemDetails, getUserItems, getBorrowedItems, getItemDetailsWithBorrow, getItemBorrowHistory |
| contacts/actions.ts | getContacts, searchContacts, getContactWithBorrowHistory, getPublicItemsForContact |
| borrow/actions.ts | getActiveBorrows, getActiveBorrowsGroupedByContact |
| groups/actions.ts | getUserGroups, getGroupDetails, getGroupByInviteCode, searchUsers |
| notifications/actions.ts | getNotifications, getUnreadNotificationCount, getPendingBorrowRequests, getPendingRequestsForItems |
| users/actions.ts | getUserProfile, getUserPublicItems |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-safe-action `.schema()` | `.inputSchema()` | v8 (2025) | `.schema()` is deprecated alias; use `inputSchema()` |
| Zod-specific integration | Standard Schema support | next-safe-action v7+ | Any Standard Schema library works (Zod, Valibot, ArkType) |
| Manual `createClient()` per action | Pass via middleware context | Pattern recommendation | Reduces Supabase client creation, centralizes auth |
| `return { error }` pattern | `throw new Error()` + `returnValidationErrors()` | next-safe-action convention | Cleaner separation of server errors vs validation errors |

## Open Questions

1. **`redirect()` in next-safe-action actions**
   - What we know: Some current actions call `redirect()` (login, signup, createGroup). next-safe-action should handle this since `redirect()` throws a special Next.js error internally.
   - What's unclear: Whether next-safe-action's error handling intercepts the redirect throw.
   - Recommendation: Test with login action first. If redirect doesn't work inside `.action()`, call redirect on the client side after checking result.data.

2. **useAction hook adoption scope**
   - What we know: next-safe-action provides `useAction` and `useActionState` hooks for better client integration.
   - What's unclear: Whether to adopt hooks now or keep direct `await action()` calls.
   - Recommendation: Keep direct `await action()` calls for this phase. Hook adoption is a separate enhancement (could be Phase 5 polish).

## Sources

### Primary (HIGH confidence)
- [next-safe-action official docs](https://next-safe-action.dev/docs/getting-started) - Getting started, v8 API, requirements
- [next-safe-action middleware docs](https://next-safe-action.dev/docs/define-actions/middleware) - Middleware pattern, `.use()` API, context passing
- [next-safe-action validation errors docs](https://next-safe-action.dev/docs/define-actions/validation-errors) - `returnValidationErrors`, `flattenValidationErrors`, error shapes
- [next-safe-action useAction docs](https://next-safe-action.dev/docs/execute-actions/hooks/useaction) - Hook API, result shape
- [next-safe-action GitHub](https://github.com/TheEdoRan/next-safe-action) - v8.0.12 confirmed, MIT license

### Secondary (MEDIUM confidence)
- [Codu next-safe-action guide](https://www.codu.co/niall/next-safe-action-type-safe-server-actions-made-easy-kaayfrkk) - Auth middleware with Supabase pattern, practical examples
- [Zod releases](https://github.com/colinhacks/zod/releases) - v4.3.6 latest, v3.23+ supports Standard Schema

### Tertiary (LOW confidence)
- None -- all findings verified with official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - next-safe-action v8 and Zod are well-documented, widely adopted, and verified compatible
- Architecture: HIGH - Middleware + colocated schemas is the documented recommended pattern
- Pitfalls: HIGH - Based on direct analysis of the codebase's current patterns vs next-safe-action conventions
- Migration inventory: HIGH - Every action function was enumerated directly from the source code

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable libraries, 60 days)
