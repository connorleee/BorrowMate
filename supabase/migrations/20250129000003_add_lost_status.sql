-- Add 'lost' status to borrow_status enum per CLAUDE.md spec
ALTER TYPE public.borrow_status ADD VALUE 'lost' AFTER 'overdue';
