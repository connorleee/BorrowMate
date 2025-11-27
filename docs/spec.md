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
   - Google OAuth sign-in.
   - Each user can belong to multiple groups.

2. **Groups**
   - Create group (name, optional description).
   - Each group has a unique invite code for shareable links.
   - Groups can be public (discoverable) or private (invite-only, default).
   - Group creator becomes the owner.
   - Invite others via shareable join code or link.
   - Switch between groups.

3. **Items**
   - Add item: name, owner (user), category, optional description, status (available / unavailable), visibility (personal vs shared), privacy (private vs public).
   - Items can belong to a group or be personal (group_id is nullable).
   - Personal items are only visible to the owner.
   - Private items are only visible to group members.
   - Public items can be discovered outside the group.
   - List/filter items for the current group.
   - View personal items on "My Items" page.

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

### Group Management
- As a user, I can create a group and become its owner.
- As a user, I can join an existing group via invite code/link.
- As a user, I can set a group to be public or private (default: private).
- As a user, I can share my group's invite link with others.
- As a user, I can view a dedicated page for each group showing its items.

### Item Management
- As a group member, I can add items to that group's inventory.
- As a user, I can add personal items (not associated with any group).
- As a user, I can set item privacy to control discoverability outside the group.

### Borrowing Workflows
- As a member, I can mark an item as borrowed by someone and see all current borrowings.
- As a member, I can mark a borrowed item as returned.

### Views & Visibility
- As a member, I can see:
  - Items I own (both group and personal items)
  - Items I'm borrowing
  - Items my friends have borrowed from me
- As a user, I can follow other users to see their public items.
- As a user, I have a "My Items" page showing:
  - Items I own
  - Items I'm currently borrowing
  - Ability to add new items

---

## Data Model (MVP)

### User
- `id` (uuid, primary key)
- `name` (string, required)
- `email` (string, unique, required)
- `phone` (string, optional)
- `created_at` (timestamp)

### Group
- `id` (uuid, primary key)
- `name` (string, required)
- `description` (string, optional)
- `privacy` (enum: "private" | "public", default: "private")
  - Note: private groups are only visible to members; public groups can be discovered and joined by anyone
- `invite_code` (string, unique, required, auto-generated)
  - Note: 8-character alphanumeric code for shareable group links
- `created_by` (uuid, foreign key → User.id)
- `created_at` (timestamp)

### GroupMembership
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key → User.id)
- `group_id` (uuid, foreign key → Group.id)
- `role` (enum: "owner" | "member")
- `created_at` (timestamp)

### Item
- `id` (uuid, primary key)
- `group_id` (uuid, nullable, foreign key → Group.id)
  - Note: nullable to support personal items not associated with any group
- `name` (string, required)
- `description` (string, optional)
- `category` (string, optional)
- `owner_user_id` (uuid, nullable, foreign key → User.id)
  - Note: nullable to support items owned by people outside the app, but MVP assumes member ownership
- `visibility` (enum: "shared" | "personal")
- `privacy` (enum: "private" | "public", default: "private")
  - Note: private items are only visible to group members; public items can be discovered outside the group
  - Note: for personal items (group_id is null), privacy controls whether the item appears in public searches
- `status` (enum: "available" | "unavailable")
- `price_usd` (float, optional)
- `created_at` (timestamp)

### BorrowRecord
- `id` (uuid, primary key)
- `item_id` (uuid, foreign key → Item.id)
- `group_id` (uuid, foreign key → Group.id)
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

### UserFollow
- `id` (uuid, primary key)
- `follower_id` (uuid, foreign key → User.id)
  - Note: the user who is following
- `following_id` (uuid, foreign key → User.id)
  - Note: the user being followed
- `created_at` (timestamp)
- Unique constraint on `(follower_id, following_id)` to prevent duplicate follows
- Check constraint to prevent self-follows

---

## Non-functional
- Tech stack:
  - **Next.js (App Router) + TypeScript + Tailwind CSS**
  - **Supabase** for Postgres + Auth
- Mobile-friendly responsive web app first.
- Clean, minimal UI, easy to extend to React Native/Expo later.