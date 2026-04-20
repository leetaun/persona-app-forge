-- Auto-recompute level whenever xp changes on profiles, using the new thresholds
-- Lv1: 0-100, Lv2: 101-300, Lv3: 301-600, Lv4: 601-1000, Lv5: >1000
CREATE OR REPLACE FUNCTION public.compute_level_from_xp(_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _xp >= 1001 THEN 5
    WHEN _xp >= 601 THEN 4
    WHEN _xp >= 301 THEN 3
    WHEN _xp >= 101 THEN 2
    ELSE 1
  END
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_level()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.level := public.compute_level_from_xp(NEW.xp);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_level_trigger ON public.profiles;
CREATE TRIGGER sync_profile_level_trigger
BEFORE INSERT OR UPDATE OF xp ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_level();

-- Backfill levels for existing users
UPDATE public.profiles SET level = public.compute_level_from_xp(xp);

-- Update legacy award_checkin_xp to use new level formula via the trigger above
CREATE OR REPLACE FUNCTION public.award_checkin_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET xp = xp + NEW.xp_earned
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;