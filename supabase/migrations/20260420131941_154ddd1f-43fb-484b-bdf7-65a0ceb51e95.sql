-- 1. Attach award_checkin_xp trigger so checkpoint XP is added to profile
DROP TRIGGER IF EXISTS trg_award_checkin_xp ON public.check_ins;
CREATE TRIGGER trg_award_checkin_xp
AFTER INSERT ON public.check_ins
FOR EACH ROW
EXECUTE FUNCTION public.award_checkin_xp();

-- 2. Attach sync_profile_level trigger so level is recalculated from xp
DROP TRIGGER IF EXISTS trg_sync_profile_level ON public.profiles;
CREATE TRIGGER trg_sync_profile_level
BEFORE INSERT OR UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_level();

-- 3. Enable realtime on profiles so UI syncs instantly
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 4. Backfill levels for existing rows
UPDATE public.profiles SET xp = xp;