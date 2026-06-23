
-- Restrict anonymous read access; restrict definer function execute; remove user-facing INSERT on user_vouchers

-- posts: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Posts public read" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
CREATE POLICY "Authenticated users can view posts"
  ON public.posts FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.posts FROM anon;

-- profiles: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles public read" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- reactions: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Reactions are viewable by everyone" ON public.reactions;
DROP POLICY IF EXISTS "Reactions public read" ON public.reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Authenticated users can view reactions"
  ON public.reactions FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.reactions FROM anon;

-- user_badges: restrict SELECT to authenticated
DROP POLICY IF EXISTS "User badges public read" ON public.user_badges;
DROP POLICY IF EXISTS "User badges are viewable by everyone" ON public.user_badges;
CREATE POLICY "Authenticated users can view user_badges"
  ON public.user_badges FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.user_badges FROM anon;

-- user_vouchers: remove user-facing INSERT; only service_role / definer functions may insert
DROP POLICY IF EXISTS "Users insert own vouchers" ON public.user_vouchers;
DROP POLICY IF EXISTS "Users can insert own vouchers" ON public.user_vouchers;

-- Revoke EXECUTE on SECURITY DEFINER helper functions from authenticated/anon/public
REVOKE EXECUTE ON FUNCTION public.award_checkin_xp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_level() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_profile_xp_from_reaction() FROM PUBLIC, anon, authenticated;
