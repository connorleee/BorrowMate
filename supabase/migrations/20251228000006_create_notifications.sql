-- Create notifications table for universal notification system
-- Extensible design to support multiple notification types (borrow requests, reminders, etc.)

-- Drop existing table and types if they exist (for clean recreation)
drop table if exists public.notifications cascade;
drop type if exists public.notification_type cascade;
drop type if exists public.notification_status cascade;

-- Create notification type enum
create type public.notification_type as enum (
  'borrow_request',
  'request_accepted',
  'request_rejected'
  -- Future types: 'due_reminder', 'overdue_alert', 'return_confirmation', 'item_shared'
);

-- Create notification status enum
create type public.notification_status as enum ('unread', 'read');

-- Create notifications table
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_user_id uuid references public.users(id) on delete cascade not null, -- Who receives this notification
  sender_user_id uuid references public.users(id) on delete set null, -- Who triggered it (nullable if system-generated)
  sender_contact_id uuid references public.contacts(id) on delete set null, -- If sender is a contact (not a user)
  type public.notification_type not null,
  title text not null, -- Notification title
  message text, -- Optional detailed message
  status public.notification_status default 'unread'::public.notification_status not null,

  -- Related entities (nullable - depends on notification type)
  related_item_id uuid references public.items(id) on delete cascade,
  related_request_id uuid references public.borrow_requests(id) on delete cascade,
  related_borrow_record_id uuid references public.borrow_records(id) on delete cascade,

  action_url text, -- Where to navigate on click (e.g., "/requests/123")

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone -- When the notification was read
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Index for fetching user's notifications (most common query)
create index notifications_recipient_status_idx on public.notifications(recipient_user_id, status, created_at desc);

-- Index for fetching unread count
create index notifications_recipient_unread_idx on public.notifications(recipient_user_id, status) where status = 'unread';

-- RLS Policies

-- Users can only view their own notifications
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_user_id);

-- System/server actions can create notifications (no user check needed on insert)
-- The application logic ensures notifications are created correctly
create policy "Authenticated users can create notifications"
  on public.notifications for insert
  with check (auth.uid() is not null);

-- Users can update their own notifications (to mark as read)
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

-- Users can delete their own notifications
create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = recipient_user_id);

-- Function to automatically set read_at timestamp when status changes to 'read'
create or replace function public.update_notification_read_at()
returns trigger as $$
begin
  if new.status = 'read' and old.status = 'unread' then
    new.read_at = timezone('utc'::text, now());
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to update read_at when notification is marked as read
create trigger update_notification_read_at
  before update on public.notifications
  for each row
  when (new.status is distinct from old.status)
  execute function public.update_notification_read_at();
