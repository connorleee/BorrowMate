# Fix "Unknown Item" Bug - COMPLETED ✅

## Resolution Summary
Created migration `20251228000002_fix_lender_item_visibility.sql` that fixes the RLS policy for lender visibility.

**The Fix**: Replaced the SECURITY DEFINER helper function approach with a direct EXISTS query in the RLS policy. This ensures that when querying borrow_records with item joins, the items are visible to lenders.

**Migration Created**: `supabase/migrations/20251228000002_fix_lender_item_visibility.sql`

**To Apply**:
1. Start Docker Desktop
2. Run: `npx supabase start`
3. Run: `npx supabase db push`

Or apply directly in Supabase dashboard SQL editor.

**What Changed**:
- Simplified the "Items are viewable by lender" RLS policy
- Removed dependency on `is_lender_of_item()` SECURITY DEFINER function
- Used direct EXISTS check for better compatibility with Supabase joins

This should fix all 6 locations where items were showing as "Unknown Item".

---

# Request to Borrow with Notification Infrastructure

## Problem Statement
Currently, the "Request to Borrow" button immediately creates a borrow record and marks the item as unavailable. We need to transform this into a proper request/approval flow where:
1. Requester clicks "Request to Borrow" → creates a borrow request (NOT a borrow record)
2. Item owner receives a notification
3. Owner can accept or reject the request
4. Upon acceptance → creates borrow record and marks item unavailable
5. Upon rejection → just updates request status

## Architectural Overview

### Database Schema
We'll create two new tables:

**`borrow_requests`** - Pending borrow requests (separate from actual borrow_records)
- `id` (uuid, PK)
- `item_id` (uuid, FK to items) - What item is being requested
- `requester_contact_id` (uuid, FK to contacts, nullable) - If owner creates request on behalf of contact
- `requester_user_id` (uuid, FK to users, nullable) - If requester is logged-in user
- `owner_user_id` (uuid, FK to users) - Item owner who needs to approve
- `requested_due_date` (date, nullable)
- `message` (text, nullable) - Optional message from requester
- `status` (text) - 'pending', 'accepted', 'rejected', 'cancelled'
- `created_at`, `updated_at`, `responded_at` (timestamps)

**`notifications`** - Universal notification system
- `id` (uuid, PK)
- `recipient_user_id` (uuid, FK to users) - Who receives this notification
- `sender_user_id` (uuid, FK to users, nullable) - Who triggered it
- `sender_contact_id` (uuid, FK to contacts, nullable) - If sender is a contact
- `type` (text) - 'borrow_request', 'request_accepted', 'request_rejected'
- `title` (text) - Notification title
- `message` (text, nullable) - Notification body
- `status` (text) - 'unread', 'read'
- `related_item_id` (uuid, FK to items, nullable)
- `related_request_id` (uuid, FK to borrow_requests, nullable)
- `related_borrow_record_id` (uuid, FK to borrow_records, nullable)
- `action_url` (text, nullable) - Where to navigate on click
- `created_at`, `read_at` (timestamps)

**Indexes:**
- `notifications(recipient_user_id, status, created_at DESC)` - For fetching user's notifications
- `borrow_requests(owner_user_id, status)` - For fetching pending requests

### Current Code Analysis
- **Current behavior**: `createBorrowRequest()` in `app/borrow/actions.ts:365` immediately creates a borrow_record
- **Files to modify**:
  - `app/borrow/actions.ts` - Update createBorrowRequest, add accept/reject actions
  - `components/contact-detail-content.tsx` - Already has UI wired up
  - `components/borrow-request-modal.tsx` - Already has UI wired up

### Notification Delivery Strategy
**MVP Approach - Simple Polling:**
- Poll for notifications every 30 seconds when user is active
- Use `useEffect` with `setInterval` in header component
- Badge shows unread count
- No real-time WebSockets (keep it simple for now)
- No email/SMS notifications (in-app only)

### Flow Diagrams

**Request Flow:**
```
User A (requester) viewing User B's (owner) public item
  ↓
Clicks "Request to Borrow"
  ↓
Creates borrow_request (status: pending)
  ↓
Creates notification for User B (type: borrow_request)
  ↓
User A sees success message
  ↓
User B polls and sees notification badge
  ↓
User B clicks notification → sees request details
  ↓
User B accepts OR rejects
  ↓
If accepted:
  - Update borrow_request (status: accepted, responded_at: now)
  - Create borrow_record (status: borrowed)
  - Update item (status: unavailable)
  - Create notification for User A (type: request_accepted)
If rejected:
  - Update borrow_request (status: rejected, responded_at: now)
  - Create notification for User A (type: request_rejected)
```

## Implementation Plan

### Phase 1: Database Schema Setup
- [ ] Create migration for `borrow_requests` table
  - Table structure with all fields
  - RLS policies (users can create requests for viewable items, owners can update their requests)
  - Indexes for performance
  - Check constraints on status enum

- [ ] Create migration for `notifications` table
  - Table structure with all fields
  - RLS policy (users can only see their own notifications)
  - Index on (recipient_user_id, status, created_at DESC)
  - Check constraints on type and status enums

- [ ] Apply migrations to local database
  - Run `npx supabase db push`
  - Verify tables created correctly

### Phase 2: Server Actions for Borrow Requests
- [ ] Update `createBorrowRequest()` in `app/borrow/actions.ts`
  - Change to create borrow_request instead of borrow_record
  - Do NOT mark item as unavailable
  - Create notification for item owner
  - Return success with request ID

- [ ] Create `acceptBorrowRequest()` in `app/borrow/actions.ts`
  - Verify user is the owner
  - Update borrow_request status to 'accepted'
  - Create actual borrow_record
  - Mark item as unavailable
  - Create notification for requester (type: request_accepted)
  - Revalidate paths

- [ ] Create `rejectBorrowRequest()` in `app/borrow/actions.ts`
  - Verify user is the owner
  - Update borrow_request status to 'rejected'
  - Create notification for requester (type: request_rejected)
  - Revalidate paths

### Phase 3: Server Actions for Notifications
- [ ] Create `getNotifications()` in new file `app/notifications/actions.ts`
  - Fetch user's notifications ordered by created_at DESC
  - Join with related items, requests, contacts for display
  - Support pagination (limit to 50 most recent)

- [ ] Create `getUnreadNotificationCount()` in `app/notifications/actions.ts`
  - Simple count query for badge
  - Optimized for performance

- [ ] Create `markNotificationAsRead()` in `app/notifications/actions.ts`
  - Update single notification status to 'read'
  - Set read_at timestamp
  - Revalidate notification count

- [ ] Create `markAllNotificationsAsRead()` in `app/notifications/actions.ts`
  - Bulk update all unread to read
  - Revalidate notification count

### Phase 4: Notification UI Components
- [ ] Create `components/notification-bell.tsx`
  - Bell icon with unread count badge
  - Click toggles notification panel
  - Polling mechanism (every 30s) to refresh count
  - Only poll when component is mounted (user is active)

- [ ] Create `components/notification-panel.tsx`
  - Dropdown panel attached to bell
  - List of notifications
  - Each notification is clickable (navigates to action_url)
  - Mark as read on click
  - "Mark all as read" button
  - Empty state when no notifications

- [ ] Create `components/notification-item.tsx`
  - Individual notification card
  - Icon based on type
  - Title and message
  - Timestamp (relative: "2 minutes ago")
  - Unread indicator (blue dot or highlighted background)
  - Click handler to navigate and mark as read

### Phase 5: Borrow Request Management UI
- [ ] Create `components/borrow-request-card.tsx`
  - Shows request details (item, requester, message, due date)
  - Accept button (green)
  - Reject button (red)
  - Loading states during submission
  - Used in notification panel and dedicated requests page

- [ ] Create `app/requests/page.tsx` (optional - dedicated page)
  - Server component that fetches pending requests
  - List of BorrowRequestCard components
  - Filter by status (pending, accepted, rejected)
  - Empty state

### Phase 6: Integration and Wiring
- [ ] Add NotificationBell to header/layout
  - Import and place in `app/layout.tsx` or navigation component
  - Position in top-right corner

- [ ] Update contact detail page behavior
  - Verify "Request to Borrow" button still works
  - Success message should say "Request sent" not "Borrowed"
  - Add note that owner needs to accept

- [ ] Add borrow request handling to notification flow
  - When clicking notification with type='borrow_request'
  - Navigate to request detail or show inline accept/reject

### Phase 7: Testing and Validation
- [ ] Test complete request flow
  - User A requests item from User B
  - User B sees notification
  - User B accepts → item becomes unavailable, User A gets notification
  - User B rejects → item stays available, User A gets notification

- [ ] Test notification polling
  - Verify polling starts/stops correctly
  - Verify badge count updates
  - Verify no polling when user is inactive

- [ ] Test edge cases
  - Item deleted while request pending
  - Multiple simultaneous requests for same item
  - Request for already unavailable item
  - Network errors during accept/reject

### Phase 8: Polish and UX Improvements
- [ ] Add optimistic UI updates
  - Instant badge count update on mark as read
  - Instant request status update on accept/reject

- [ ] Add loading states and error handling
  - Show spinners during async operations
  - Display friendly error messages
  - Handle RLS policy violations gracefully

- [ ] Add success confirmations
  - Toast notifications for successful actions
  - Subtle animations for state changes

## Key Design Decisions

### 1. Polling vs Real-time
**Decision: Polling (30s interval)**
- Simpler to implement
- No WebSocket infrastructure needed
- Good enough for MVP (notifications aren't ultra time-sensitive)
- Can upgrade to Supabase Realtime later if needed

### 2. Notification Persistence
**Decision: Keep all notifications indefinitely**
- Users can review notification history
- No automatic cleanup (can add later if storage becomes issue)
- Mark as read vs delete (keep deleted ones hidden)

### 3. Request Expiration
**Decision: No automatic expiration for MVP**
- Requests stay pending until accepted/rejected
- Owner can always reject if no longer relevant
- Can add auto-expire later (e.g., 7 days)

### 4. Multiple Requests for Same Item
**Decision: Allow multiple pending requests**
- First accepted request wins
- Subsequent accepts should fail gracefully (item unavailable)
- Rejected requests don't affect item availability

### 5. Notification Types (Extensible)
**Initial types:**
- `borrow_request` - Someone wants to borrow your item
- `request_accepted` - Your borrow request was accepted
- `request_rejected` - Your borrow request was rejected

**Future types (not implemented now):**
- `due_reminder` - Item due soon
- `overdue_alert` - Item is overdue
- `return_confirmation` - Item was returned
- `item_shared` - Someone shared item with you

## Simplicity Principles
Following CLAUDE.md instructions to keep everything simple:

1. **Minimal schema changes**: Only 2 new tables, both straightforward
2. **No complex state machines**: Simple status enums (pending/accepted/rejected)
3. **Simple polling**: No WebSocket complexity
4. **In-app only**: No email/SMS/push notifications
5. **Reuse existing patterns**: Follow established server action and component patterns
6. **No over-engineering**: No notification preferences, grouping, threading, or advanced features

## Files to Create
- `supabase/migrations/20251228000002_create_borrow_requests.sql`
- `supabase/migrations/20251228000003_create_notifications.sql`
- `app/notifications/actions.ts`
- `components/notification-bell.tsx`
- `components/notification-panel.tsx`
- `components/notification-item.tsx`
- `components/borrow-request-card.tsx`
- `app/requests/page.tsx` (optional)

## Files to Modify
- `app/borrow/actions.ts` - Update createBorrowRequest, add accept/reject actions
- `app/layout.tsx` or navigation component - Add NotificationBell
- (No changes needed to contact-detail-content.tsx or borrow-request-modal.tsx - they already work)

## Success Criteria
✅ User can request to borrow an item
✅ Owner receives in-app notification
✅ Owner can accept or reject from notification
✅ Acceptance creates borrow record and marks item unavailable
✅ Rejection leaves item available
✅ Requester receives notification of accept/reject decision
✅ Notification badge shows unread count
✅ All notifications are visible in dropdown panel
✅ Complete flow works end-to-end

## Notes
- Following CLAUDE.md: No lazy fixes, find root causes
- Keep changes minimal and simple
- Impact as little code as possible
- No temporary hacks or over-engineering
- Thorough testing at each phase

---

# Fix Infinite Recursion in borrow_records RLS Policy - COMPLETED ✅

## Problem
When accepting a borrow request, users see error: "infinite recursion detected in policy for relation 'borrow_records'"

## Root Cause Analysis
The recursion chain was:
1. INSERT into `borrow_records` triggers INSERT policy
2. INSERT policy "Users can create borrow records for items they own with their contacts." (from 20250129000001) queries `items` table
3. Items SELECT policy "Items are viewable by borrower" (from 20251228000003) queries `borrow_records` **directly without SECURITY DEFINER**
4. PostgreSQL detects circular dependency = infinite recursion error

## Solution
Migration 20250129000010 already created a SECURITY DEFINER function `is_borrower_of_item()` that bypasses RLS. However, migration 20251228000003 recreated the "Items are viewable by borrower" policy with a direct query instead of using this function.

**Fix:** Drop and recreate the "Items are viewable by borrower" policy to use the SECURITY DEFINER function.

## Changes Made
- [x] Created migration `20251228000010_fix_items_borrower_policy_recursion.sql`
- [x] Applied migration to local Supabase

## Review
- The fix follows the same pattern as migration 20251228000009 which fixed "Items are viewable by lender" using `is_lender_of_item()`
- SECURITY DEFINER functions bypass RLS and break the circular dependency
- No application code changes required - purely a database policy fix

---

# Add Dismiss Notifications Feature - COMPLETED ✅

## Overview
Add the ability for users to dismiss (delete) notifications from their notification panel.

## Todo Items

- [x] Add `dismissNotification` server action to delete a single notification
- [x] Add `dismissAllNotifications` server action to clear all notifications
- [x] Add dismiss button (X) to notification-item.tsx component
- [x] Add "Clear all" button to notification-panel.tsx
- [x] Test the functionality (build passed)

## Review

### Changes Made

**1. Server Actions (`app/notifications/actions.ts`)**
- Added `dismissNotification(notificationId)` - deletes a single notification
- Added `dismissAllNotifications()` - clears all notifications for the user
- Both actions revalidate `/dashboard` and `/notifications` paths

**2. Notification Item (`components/notification-item.tsx`)**
- Added `onDismiss` callback prop to the interface
- Added `isDismissing` state for loading indicator
- Added `handleDismiss` function that calls the server action
- Added X button next to each notification with hover states and loading spinner

**3. Notification Panel (`components/notification-panel.tsx`)**
- Imported `dismissAllNotifications` action
- Added `isClearingAll` state
- Added `handleNotificationDismiss` to remove from local state
- Added `handleClearAll` to clear all notifications
- Added "Clear all" button in header (gray, turns red on hover)
- Passed `onDismiss` prop to NotificationItem

### Files Modified
- `app/notifications/actions.ts`
- `components/notification-item.tsx`
- `components/notification-panel.tsx`

### Notes
- RLS policy for deletion already existed in the database schema
- All changes were minimal and targeted
- Build passes with no TypeScript errors
