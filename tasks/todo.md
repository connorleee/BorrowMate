# Contact-Centric Lending Implementation

## Overview
Transform BorrowMate to contact-centric lending model per updated CLAUDE.md. This todo tracks implementation of the plan at `/Users/connorlee/.claude/plans/compiled-squishing-parasol.md`.

---

## Phase 1: Database Foundation

### Migration 1: Create Contacts Table
- [ ] Create `supabase/migrations/20250129000000_create_contacts_table.sql`
- [ ] Define contacts table schema (id, owner_user_id, name, email, phone, linked_user_id, timestamps)
- [ ] Add RLS policies (owner-only access)
- [ ] Add indexes on owner_user_id and linked_user_id
- [ ] Add auto-updating updated_at trigger
- [ ] Test migration locally with `npx supabase db reset`

### Migration 2: Add contact_id to borrow_records
- [ ] Create `supabase/migrations/20250129000001_add_contact_id_to_borrow_records.sql`
- [ ] Add contact_id column (nullable initially)
- [ ] Add foreign key constraint to contacts table with CASCADE
- [ ] Update RLS policies to allow contact owners to view records
- [ ] Test migration locally

### Migration 3: Add Missing Item Fields
- [ ] Create `supabase/migrations/20250129000002_add_missing_item_fields.sql`
- [ ] Add ownership_type enum ('owner', 'shared')
- [ ] Add qr_slug text field
- [ ] Add updated_at timestamp
- [ ] Add auto-updating trigger for updated_at
- [ ] Test migration locally

### Migration 4: Add 'lost' Status
- [ ] Create `supabase/migrations/20250129000003_add_lost_status.sql`
- [ ] Add 'lost' to borrow_status enum
- [ ] Test migration locally

### Migration 5: Add updated_at to borrow_records
- [ ] Create `supabase/migrations/20250129000004_add_updated_at_to_borrow_records.sql`
- [ ] Add updated_at timestamp field
- [ ] Add auto-update trigger
- [ ] Test migration locally

### Migration 6: Migrate Existing Borrow Records
- [ ] Create `supabase/migrations/20250129000005_migrate_existing_borrow_records.sql`
- [ ] Auto-create contacts from borrower_user_id records (with linked_user_id)
- [ ] Auto-create contacts from borrower_name-only records
- [ ] Update all borrow_records with contact_id
- [ ] Validate no orphaned records
- [ ] Make contact_id NOT NULL
- [ ] Test data migration thoroughly

### Migration 7: Remove User Follows
- [ ] Create `supabase/migrations/20250129000006_remove_user_follows.sql`
- [ ] Drop user_follows table
- [ ] Remove any related indexes
- [ ] Remove RLS policies
- [ ] Test migration locally

### Validate All Migrations
- [ ] Run `npx supabase db reset` to test full migration sequence
- [ ] Verify contacts table exists with correct schema
- [ ] Verify borrow_records has contact_id (NOT NULL)
- [ ] Verify user_follows table is gone
- [ ] Check all RLS policies work correctly

---

## Phase 2: Backend - Contact Management

### Create Contact Server Actions
- [ ] Create `app/contacts/actions.ts`
- [ ] Implement `getContacts()` - fetch user's contacts
- [ ] Implement `searchContacts(query)` - search by name/email/phone
- [ ] Implement `createContact(formData)` - create new contact (name required)
- [ ] Implement `updateContact(contactId, formData)` - edit contact
- [ ] Implement `deleteContact(contactId)` - remove contact
- [ ] Implement `linkContactToUser(contactId, userId)` - link to registered user
- [ ] Add proper error handling and RLS checks
- [ ] Test all functions with local Supabase

### Update Borrow Actions
- [ ] Open `app/borrow/actions.ts`
- [ ] Implement `batchLendToContact(itemIds[], contactId, dueDate?)` - core lending function
- [ ] Implement `getOrCreateContactForGroupMember(groupMemberId)` - auto-create from group members
- [ ] Implement `getActiveBorrowsGroupedByContact()` - for dashboard
- [ ] Test all new functions

### Update Items Actions
- [ ] Open `app/items/actions.ts`
- [ ] Remove `getPotentialBorrowers()` function
- [ ] Remove `searchPotentialBorrowers()` function
- [ ] Remove `batchLendItems()` function
- [ ] Verify no other code depends on these functions

### Update Users Actions
- [ ] Open `app/users/actions.ts`
- [ ] Remove `followUser()` function
- [ ] Remove `unfollowUser()` function
- [ ] Remove `getFollowers()` function
- [ ] Remove `getFollowing()` function
- [ ] Verify no other code depends on user_follows

---

## Phase 3: Frontend - Contact Management UI

### Create Contact Management Page
- [ ] Create `app/contacts/page.tsx`
- [ ] Fetch contacts using server component
- [ ] Display contact list
- [ ] Add "Add Contact" button
- [ ] Add search bar
- [ ] Add empty state for new users
- [ ] Test page renders correctly

### Create Contact List Component
- [ ] Create `components/contact-list-section.tsx`
- [ ] Implement as client component
- [ ] Add debounced search (300ms)
- [ ] Display contact cards
- [ ] Handle edit/delete modal state
- [ ] Test component

### Create Contact Card Component
- [ ] Create `components/contact-card.tsx`
- [ ] Display name, email, phone
- [ ] Add badge for linked BorrowMate users
- [ ] Add edit button
- [ ] Add delete button with confirmation
- [ ] Test component

### Create Add Contact Modal
- [ ] Create `components/add-contact-modal.tsx`
- [ ] Implement portal-rendered modal
- [ ] Add form: name (required), email (optional), phone (optional)
- [ ] Add validation
- [ ] Add error handling
- [ ] Call `createContact()` server action
- [ ] Test modal functionality

### Create Add Contact Button
- [ ] Create `components/add-contact-button.tsx`
- [ ] Simple button that opens AddContactModal
- [ ] Test integration

---

## Phase 4: Frontend - Contact-First Lending Flow

### Major Refactor: Batch Lend Modal
- [ ] Open `components/batch-lend-modal.tsx`
- [ ] Replace user selection with contact selection
- [ ] Add inline "Create New Contact" form
- [ ] Show group members with auto-create on selection
- [ ] Implement contact search with debouncing
- [ ] Add optional due date selector
- [ ] Update callback: `onLend(contactId, dueDate?)`
- [ ] Test 3-5 tap flow: search/create contact → optional due date → lend
- [ ] Test auto-create from group member selection

### Update MyInventorySection
- [ ] Open `components/my-inventory-section.tsx`
- [ ] Update `handleLendItems` to call `batchLendToContact(contactId, dueDate)`
- [ ] Update success message to show contact name
- [ ] Pass updated callback signature to BatchLendModal
- [ ] Test batch lending flow end-to-end

### Update Dashboard
- [ ] Open `app/dashboard/page.tsx`
- [ ] Use `getActiveBorrowsGroupedByContact()` for lent items
- [ ] Display lent items grouped by contact (collapsible sections)
- [ ] Show contact name/email for each group
- [ ] Show all items lent to each contact
- [ ] Add "Mark Returned" button for each item
- [ ] Add "Manage Contacts" link
- [ ] Test dashboard displays correctly

### Update Items Page
- [ ] Open `app/items/page.tsx`
- [ ] Verify MyInventorySection integration works
- [ ] Test that updated modal appears correctly
- [ ] No major changes needed (already uses MyInventorySection)

---

## Phase 5: Navigation & Polish

### Update Top Navigation
- [ ] Open `components/TopNav.tsx`
- [ ] Add "Contacts" navigation link
- [ ] Order: Dashboard | Items | Contacts | Groups | Discover
- [ ] Test navigation

### Update Landing Page
- [ ] Open `app/page.tsx`
- [ ] Update hero: "Never lose track of what you've lent"
- [ ] Update subheading: "Lend to anyone — they don't need an account"
- [ ] Update features:
  - [ ] "Lend to Anyone"
  - [ ] "Stay Organized"
  - [ ] "Manage Groups" (secondary)
- [ ] Test landing page

---

## Phase 6: Cleanup - Remove User Follows

### Remove User Follows UI
- [ ] Search codebase for user_follows references
- [ ] Remove any "Follow" buttons from user profiles
- [ ] Remove "Following" / "Followers" navigation items (if any)
- [ ] Update discovery/search pages to not rely on follows
- [ ] Remove any unused components related to follows
- [ ] Test that no UI references remain

---

## Phase 7: Testing & Validation

### Database Testing
- [ ] All migrations run successfully on local Supabase
- [ ] Contacts table RLS prevents cross-user access
- [ ] Borrow records RLS allows contact owners to view
- [ ] Data migration created contacts for all existing records
- [ ] No orphaned borrow_records (all have contact_id)
- [ ] user_follows table is completely removed

### Backend Testing
- [ ] Contact CRUD operations work with proper RLS
- [ ] Search filters contacts by owner
- [ ] `batchLendToContact()` validates contact ownership
- [ ] `getOrCreateContactForGroupMember()` auto-creates contacts
- [ ] Grouped borrow query returns correct contact groupings
- [ ] All user_follows functions are gone

### Frontend Testing
- [ ] Contacts page loads and displays contacts
- [ ] Search debouncing works (300ms delay)
- [ ] Add/edit/delete contact modals function correctly
- [ ] Batch lend modal shows contacts (not users)
- [ ] Quick contact creation in lend modal works
- [ ] Auto-create contact from group member selection works
- [ ] Dashboard groups lent items by contact correctly
- [ ] "Mark Returned" updates item status and borrow record
- [ ] No user follows UI remains anywhere

### UX Flow Testing
- [ ] Test: Multi-select items → Continue → Search/select contact → Lend = ~5-6 taps
- [ ] Test: Multi-select → Continue → Create contact inline → Lend = ~6 taps
- [ ] Test: Multi-select → Continue → Select group member (auto-creates contact) → Lend
- [ ] Verify contact-first flow matches CLAUDE.md vision
- [ ] Test on mobile (responsive design)

### Build & Deploy Verification
- [ ] Run `npm run build` successfully
- [ ] Run `npm run lint` with no errors
- [ ] Test in production-like environment
- [ ] Verify TypeScript types are correct (may need regeneration)

---

## Review

After completion, document:
- [ ] Summary of changes made
- [ ] Any deviations from plan (with rationale)
- [ ] Known issues or future improvements
- [ ] Migration notes for production deployment
