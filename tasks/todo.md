# CLAUDE.md Update Plan

## Overview
Update the project CLAUDE.md file to reflect new contact-centric lending philosophy. Focus on simplicity and minimal friction for users.

## Tasks

### 1. Update PROJECT OVERVIEW
- [ ] Rewrite to emphasize BorrowMate/BorrowBase as contact-centric item lending app
- [ ] Add core flow description: "Lend something → pick or create contact → pick one or more items → optional due date → confirm"
- [ ] Note that groups and follows are secondary/optional

### 2. Add High-Level Flow Subsection to ARCHITECTURE
- [ ] Add new subsection "High-Level Flow (Contact-Centric Lending)"
- [ ] Describe 3-5 tap lending flow
- [ ] Keep existing Next.js/Supabase architecture notes (oriented around lending model)

### 3. Update DATABASE SCHEMA
- [ ] Add contacts table documentation with fields (id, owner_user_id, name, email, phone, linked_user_id, timestamps)
- [ ] Note that contacts are per-user and private
- [ ] Update borrow_records to include contact_id (required), borrower_user_id (nullable), group_id (nullable), and status enum including 'lost'
- [ ] Update items to document ownership_type ('owner'|'shared') and qr_slug (optional)
- [ ] Keep groups & follows sections but explicitly mark as secondary/organizational

### 4. Add UI & PRODUCT FLOWS Section
- [ ] Create new section documenting:
  - Core lending flow (3-5 taps)
  - Quick return flow
  - Multi-item lending sessions
  - Optional features (reminders, QR/NFC, activity timelines, ownership badges)

### 5. Revise BATCH LENDING FEATURE Section
- [ ] Describe as "one contact + multiple items" using contact-centric model
- [ ] Mention server action creates multiple borrow_records

### 6. General Cleanup
- [ ] Remove outdated group-centric lending references
- [ ] Ensure entire file is valid Markdown
- [ ] Verify consistency with Option 3 philosophy throughout

## Review

### ✅ Changes Summary

**1. PROJECT OVERVIEW**
- Rewritten to emphasize BorrowMate as contact-centric item lending app
- Added clear core flow: "Lend something → pick or create contact → pick one or more items → optional due date → confirm"
- Explicitly noted groups/follows as optional organizational features

**2. ARCHITECTURE - New High-Level Flow Subsection**
- Added "High-Level Flow (Contact-Centric Lending)" describing 5-step lending journey
- Clarified that groups are secondary to core contact-based lending
- Kept existing Next.js/Supabase architecture notes

**3. DATABASE SCHEMA Updates**
- Added new `contacts` table documentation with full field list and RLS policy
- Updated `borrow_records` to include required `contact_id` field and 'lost' status
- Updated `items` with `ownership_type` and `qr_slug` fields
- Marked `groups` and `user_follows` as secondary/optional with clarifying notes
- Updated RLS notes to reflect contact-based lending model

**4. NEW SECTION: UI & Product Flows**
- Documented core 3-5 tap lending flow
- Quick return flow for marking items as returned
- Multi-item lending sessions (one contact + multiple items)
- Optional features: Smart reminders, QR/NFC actions, activity timelines, ownership badges

**5. BATCH LENDING FEATURE**
- Reframed as core contact-centric feature
- Emphasized "one contact + multiple items" model
- Updated implementation details to reference contact_id

**6. General Updates**
- Updated "Important Gotchas" to reference contact-based lending
- Removed all outdated group-centric lending references
- Verified all Markdown formatting is valid
- Ensured consistent messaging throughout (Option 3 philosophy)

### Key Philosophy
**SIMPLICITY IS KEY** - Every change emphasizes minimal friction and user-centric design. Contact selection is the primary action, items are secondary, and groups/follows remain as optional organizational tools.
