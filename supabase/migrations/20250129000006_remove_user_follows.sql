-- Remove user_follows table - transitioning to contact-centric model (Decision #1)
-- User follows are no longer needed since contacts replace this functionality

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can follow others." ON public.user_follows;
DROP POLICY IF EXISTS "Users can unfollow others." ON public.user_follows;
DROP POLICY IF EXISTS "Users can view follower relationships." ON public.user_follows;

-- Drop indexes
DROP INDEX IF EXISTS public.user_follows_follower_id_idx;
DROP INDEX IF EXISTS public.user_follows_following_id_idx;

-- Drop the table
DROP TABLE IF EXISTS public.user_follows;
