-- Enable UUID extension (not strictly needed for gen_random_uuid in PG13+, but good practice to keep if other things need it, 
-- though here we will comment it out to avoid "already exists" noise if that was the only issue, 
-- but actually the error was function not found. We will just remove the dependency on it.)
-- create extension if not exists "uuid-ossp";

-- USERS (Profiles)
-- Note: This table mirrors auth.users for public access and additional fields
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- GROUPS
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.groups enable row level security;



-- GROUP MEMBERSHIPS
create type public.membership_role as enum ('owner', 'member');

create table public.group_memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  group_id uuid references public.groups(id) not null,
  role public.membership_role default 'member'::public.membership_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, group_id)
);

alter table public.group_memberships enable row level security;

create policy "Groups are viewable by members."
  on public.groups for select
  using (
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = groups.id
      and group_memberships.user_id = auth.uid()
    )
  );

create policy "Users can create groups."
  on public.groups for insert
  with check ( auth.uid() = created_by );

create policy "Memberships are viewable by group members."
  on public.group_memberships for select
  using (
    exists (
      select 1 from public.group_memberships as gm
      where gm.group_id = group_memberships.group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Group creators can insert membership for themselves."
  on public.group_memberships for insert
  with check ( auth.uid() = user_id ); 
  -- Note: Invites will need more complex logic or a separate function/table, 
  -- for MVP we might just allow adding if you know the group ID or similar, 
  -- but strictly, usually only owners add or users join via code.
  -- For now, allowing users to join if they have the ID (open join) or if they are the creator.

-- ITEMS
create type public.item_visibility as enum ('shared', 'personal');
create type public.item_status as enum ('available', 'unavailable');

create table public.items (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) not null,
  name text not null,
  description text,
  category text,
  owner_user_id uuid references public.users(id), -- nullable per spec, but usually set
  visibility public.item_visibility default 'shared'::public.item_visibility not null,
  status public.item_status default 'available'::public.item_status not null,
  price_usd numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.items enable row level security;

create policy "Items are viewable by group members."
  on public.items for select
  using (
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = items.group_id
      and group_memberships.user_id = auth.uid()
    )
  );

create policy "Group members can create items."
  on public.items for insert
  with check (
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = items.group_id
      and group_memberships.user_id = auth.uid()
    )
  );

create policy "Owners can update their items."
  on public.items for update
  using ( auth.uid() = owner_user_id );

-- BORROW RECORDS
create type public.borrow_status as enum ('borrowed', 'returned', 'overdue');

create table public.borrow_records (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references public.items(id) not null,
  group_id uuid references public.groups(id) not null,
  lender_user_id uuid references public.users(id) not null,
  borrower_user_id uuid references public.users(id), -- nullable
  borrower_name text, -- used if borrower_user_id is null
  start_date timestamp with time zone not null,
  due_date timestamp with time zone,
  returned_at timestamp with time zone,
  status public.borrow_status default 'borrowed'::public.borrow_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.borrow_records enable row level security;

create policy "Borrow records are viewable by group members."
  on public.borrow_records for select
  using (
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = borrow_records.group_id
      and group_memberships.user_id = auth.uid()
    )
  );

create policy "Group members can create borrow records."
  on public.borrow_records for insert
  with check (
    exists (
      select 1 from public.group_memberships
      where group_memberships.group_id = borrow_records.group_id
      and group_memberships.user_id = auth.uid()
    )
  );

create policy "Lenders or Borrowers can update records (e.g. return)."
  on public.borrow_records for update
  using ( auth.uid() = lender_user_id or auth.uid() = borrower_user_id );

-- TRIGGERS for User creation
-- Automatically create a public.users entry when a new auth.users is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
