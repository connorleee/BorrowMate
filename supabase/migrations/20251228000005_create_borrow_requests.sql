-- Create borrow_requests table for pending borrow requests (separate from actual borrow_records)
-- This table stores requests that need owner approval before becoming actual borrows

-- Drop existing table and type if they exist (for clean recreation)
drop table if exists public.borrow_requests cascade;
drop type if exists public.borrow_request_status cascade;

-- Create status enum for borrow requests
create type public.borrow_request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

-- Create borrow_requests table
create table public.borrow_requests (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  requester_contact_id uuid references public.contacts(id) on delete set null, -- If owner creates request on behalf of contact
  requester_user_id uuid references public.users(id) on delete cascade, -- If requester is logged-in user
  owner_user_id uuid references public.users(id) on delete cascade not null, -- Item owner who needs to approve
  requested_due_date date, -- Optional requested due date
  message text, -- Optional message from requester
  status public.borrow_request_status default 'pending'::public.borrow_request_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone, -- When owner accepted/rejected

  -- Constraint: Must have either requester_contact_id or requester_user_id
  constraint borrow_requests_requester_check check (
    (requester_contact_id is not null) or (requester_user_id is not null)
  )
);

-- Enable RLS
alter table public.borrow_requests enable row level security;

-- Index for fetching pending requests by owner
create index borrow_requests_owner_status_idx on public.borrow_requests(owner_user_id, status, created_at desc);

-- Index for fetching requests by requester
create index borrow_requests_requester_idx on public.borrow_requests(requester_user_id, created_at desc);

-- Index for fetching requests by item
create index borrow_requests_item_idx on public.borrow_requests(item_id, status);

-- RLS Policies

-- Users can view borrow requests where they are the owner
create policy "Users can view borrow requests for their items"
  on public.borrow_requests for select
  using (auth.uid() = owner_user_id);

-- Users can view borrow requests they created
create policy "Users can view their own borrow requests"
  on public.borrow_requests for select
  using (auth.uid() = requester_user_id);

-- Users can create borrow requests for items they can see (public items from contacts)
-- This policy allows creating requests for public items owned by linked contacts
create policy "Users can create borrow requests for viewable items"
  on public.borrow_requests for insert
  with check (
    -- Item must be viewable by the requester
    exists (
      select 1 from public.items
      where items.id = borrow_requests.item_id
      and (
        -- User owns the item (though this would be unusual to request your own item)
        items.owner_user_id = auth.uid()
        or
        -- Item is public and owned by a contact's linked user
        (
          items.privacy = 'public'
          and exists (
            select 1 from public.contacts
            where contacts.owner_user_id = auth.uid()
            and contacts.linked_user_id = items.owner_user_id
          )
        )
      )
    )
    and auth.uid() = requester_user_id
  );

-- Item owners can update borrow requests (to accept/reject)
create policy "Owners can update borrow requests for their items"
  on public.borrow_requests for update
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- Requesters can update their own requests (to cancel)
create policy "Users can cancel their own borrow requests"
  on public.borrow_requests for update
  using (auth.uid() = requester_user_id)
  with check (auth.uid() = requester_user_id and status = 'cancelled');

-- Function to automatically update updated_at timestamp
create or replace function public.update_borrow_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on row update
create trigger update_borrow_requests_updated_at
  before update on public.borrow_requests
  for each row
  execute function public.update_borrow_requests_updated_at();
