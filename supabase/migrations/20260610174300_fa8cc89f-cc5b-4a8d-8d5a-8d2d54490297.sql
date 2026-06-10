
-- 1) Restrict check_ins SELECT to authenticated owners + admins (no public GPS exposure)
DROP POLICY IF EXISTS "Check-ins public read" ON public.check_ins;
CREATE POLICY "Users view own check-ins" ON public.check_ins
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Restrict vouchers SELECT to authenticated users only (hide codes from anon)
DROP POLICY IF EXISTS "Vouchers public read" ON public.vouchers;
CREATE POLICY "Vouchers authenticated read" ON public.vouchers
  FOR SELECT TO authenticated
  USING (true);

-- 3) Prevent users from self-awarding badges
DROP POLICY IF EXISTS "Users insert own user_badges" ON public.user_badges;

-- 4) Restrict storage listing on checkin-photos bucket (direct URL access still works since bucket is public)
DROP POLICY IF EXISTS "Checkin photos public read" ON storage.objects;
CREATE POLICY "Users list own checkin photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'checkin-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5) Lock down SECURITY DEFINER trigger functions from being called via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.award_checkin_xp() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_profile_level() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.adjust_profile_xp_from_reaction() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
-- has_role is used inside RLS policies; keep execute for authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;

-- 6) Scope Realtime channel subscriptions to authenticated users
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "Authenticated can subscribe" ON realtime.messages FOR SELECT TO authenticated USING (true)';
EXCEPTION WHEN duplicate_object THEN NULL;
WHEN insufficient_privilege THEN NULL;
END $$;
