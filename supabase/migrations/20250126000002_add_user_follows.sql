-- Add user follow functionality
-- This migration adds support for users to follow other users and view their public items

-- USER FOLLOWS table
create table if not exists public.user_follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.users(id) on delete cascade not null,
  following_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Prevent users from following themselves
  constraint no_self_follow check (follower_id != following_id),
  -- Prevent duplicate follows
  unique(follower_id, following_id)
);

-- Create indexes for efficient queries
create index if not exists user_follows_follower_id_idx on public.user_follows(follower_id);
create index if not exists user_follows_following_id_idx on public.user_follows(following_id);

-- Enable RLS
alter table public.user_follows enable row level security;

-- RLS Policies for user_follows
drop policy if exists "Users can view their own follows (as follower)." on public.user_follows;
create policy "Users can view their own follows (as follower)."
  on public.user_follows for select
  using ( auth.uid() = follower_id );

drop policy if exists "Users can view their own follows (as following)." on public.user_follows;
create policy "Users can view their own follows (as following)."
  on public.user_follows for select
  using ( auth.uid() = following_id );

drop policy if exists "Users can follow others." on public.user_follows;
create policy "Users can follow others."
  on public.user_follows for insert
  with check ( auth.uid() = follower_id );

drop policy if exists "Users can unfollow others." on public.user_follows;
create policy "Users can unfollow others."
  on public.user_follows for delete
  using ( auth.uid() = follower_id );

-- Add privacy field to items table if it doesn't exist
-- (Note: According to spec.md line 129, this field should already exist)
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'items' 
    and column_name = 'privacy'
  ) then
    create type public.item_privacy as enum ('private', 'public');
    alter table public.items
      add column privacy public.item_privacy default 'private'::public.item_privacy not null;
  end if;
end $$;

-- Update item RLS policies to allow viewing public items from followed users
drop policy if exists "Public items are viewable by followers." on public.items;
create policy "Public items are viewable by followers."
  on public.items for select
  using (
    -- Item must be public
    privacy = 'public'
    -- AND current user must be following the item owner
    and exists (
      select 1 from public.user_follows
      where user_follows.follower_id = auth.uid()
      and user_follows.following_id = items.owner_user_id
    )
  );

-- Also allow users to view their own items (if not already covered)
drop policy if exists "Users can view their own items." on public.items;
create policy "Users can view their own items."
  on public.items for select
  using ( auth.uid() = owner_user_id );
