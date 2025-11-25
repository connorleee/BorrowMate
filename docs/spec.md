# BorrowBase – Spec (MVP)

## One-line
BorrowBase is a shared inventory and borrowing tracker for households and friend groups.

## Problem
Roommates and friend groups constantly lose track of:
- Who owns which items (tools, games, kitchen gear, etc.)
- Who borrowed what and when it’s coming back
- Shared vs personal items
- Household inventory during move-in/move-out

Existing roommate apps focus on **bills/chores**, not **stuff**.

## Core Value
“Never lose track of shared stuff again.”

BorrowBase lets users:
- Track items in households and friend groups
- Mark items as personal vs shared
- Log borrow/lend events with status (borrowed/returned/overdue)
- See at a glance “who has what”

## Target users
- Roommates
- Couples living together
- Tight friend groups with lots of shared items (board games, tools, consoles, etc.)

---

## MVP Scope (v0.1)

### Entities
- **User**
- **Group** (or Household)
- **Membership** (`user` ↔ `group`)
- **Item**
- **BorrowRecord**

### Must-have features
1. **Auth**
   - Email/password login and signup.
   - Each user can belong to multiple groups.

2. **Groups**
   - Create group (name, optional description).
   - Invite others via shareable join code or link.
   - Switch between groups.

3. **Items**
   - Add item: name, owner (user), category, optional description, status (available / unavailable), visibility (personal vs shared).
   - Items belong to a single group.
   - List/filter items for the current group.

4. **Borrowing**
   - Mark item as borrowed:
     - borrower (member of group or free-form name)
     - lender (item owner)
     - start date
     - optional due date
   - Mark as returned.
   - Show “who has what” and “what am I borrowing” views.

### Nice-to-have (later)
- Push notifications / reminders.
- Photos of items.
- Activity feed (“Connor borrowed Drill from Alex”).

---

## Core User Stories (v0.1)

### Authentication
- As a user, I can sign up/log in.

### Household Management
- As a user, I can create a household and become its owner.
- As a user, I can join an existing household via invite code/link.

### Item Management
- As a household member, I can add items to that household's inventory.

### Borrowing Workflows
- As a member, I can mark an item as borrowed by someone and see all current borrowings.
- As a member, I can mark a borrowed item as returned.

### Views & Visibility
- As a member, I can see:
  - Items I own
  - Items I'm borrowing
  - Items my friends have borrowed from me

---

## Data Model (MVP)

### User
- `id` (uuid, primary key)
- `email` (string, unique, required)
- `created_at` (timestamp)

### Household
- `id` (uuid, primary key)
- `name` (string, required)
- `description` (string, optional)
- `created_by` (uuid, foreign key → User.id)
- `created_at` (timestamp)

### HouseholdMembership
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → User.id)
- `household_id` (uuid, foreign key → Household.id)
- `role` (enum: "owner" | "member")
- `created_at` (timestamp)

### Item
- `id` (uuid, primary key)
- `household_id` (uuid, foreign key → Household.id)
- `name` (string, required)
- `description` (string, optional)
- `category` (string, optional)
- `owner_user_id` (uuid, nullable, foreign key → User.id)
  - Note: nullable to support items owned by people outside the app, but MVP assumes member ownership
- `visibility` (enum: "shared" | "personal")
- `status` (enum: "available" | "unavailable")
- `created_at` (timestamp)

### BorrowRecord
- `id` (uuid, primary key)
- `item_id` (uuid, foreign key → Item.id)
- `household_id` (uuid, foreign key → Household.id)
- `lender_user_id` (uuid, foreign key → User.id)
- `borrower_user_id` (uuid, nullable, foreign key → User.id)
  - Note: nullable if borrower is external to the app
- `borrower_name` (string, nullable)
  - Note: used when borrower_user_id is null (external borrower)
- `start_date` (timestamp, required)
- `due_date` (timestamp, nullable)
- `returned_at` (timestamp, nullable)
- `status` (enum: "borrowed" | "returned" | "overdue")
  - Note: can be derived but stored for performance
- `created_at` (timestamp)

---

## Non-functional
- Tech stack:
  - **Next.js (App Router) + TypeScript + Tailwind CSS**
  - **Supabase** for Postgres + Auth
- Mobile-friendly responsive web app first.
- Clean, minimal UI, easy to extend to React Native/Expo later.