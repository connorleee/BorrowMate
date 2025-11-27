-- Add invite codes to groups for shareable links
-- This migration adds support for shareable group invite links

-- Function to generate random invite codes
create or replace function generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars like 0, O, 1, I
  result text := '';
  i integer;
begin
  for i in 1..8 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Add invite_code column to groups table
alter table public.groups
  add column invite_code text unique;

-- Generate invite codes for existing groups
update public.groups
set invite_code = generate_invite_code()
where invite_code is null;

-- Make invite_code required for new groups
alter table public.groups
  alter column invite_code set not null;

-- Create index for faster lookups
create index groups_invite_code_idx on public.groups(invite_code);

-- Function to ensure invite code is set on group creation
create or replace function set_group_invite_code()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null then
    -- Keep trying until we get a unique code
    loop
      new.invite_code := generate_invite_code();
      -- Check if code is unique
      if not exists (select 1 from public.groups where invite_code = new.invite_code) then
        exit;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

-- Trigger to auto-generate invite codes
create trigger ensure_group_invite_code
  before insert on public.groups
  for each row
  execute function set_group_invite_code();
