DELETE FROM public.reactions r
USING public.reactions dup
WHERE r.id > dup.id
  AND r.post_id = dup.post_id
  AND r.user_id = dup.user_id
  AND r.medal = dup.medal;

CREATE UNIQUE INDEX IF NOT EXISTS reactions_post_user_medal_unique_idx
ON public.reactions (post_id, user_id, medal);

CREATE OR REPLACE FUNCTION public.adjust_profile_xp_from_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  xp_delta integer := 0;
  target_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    xp_delta := CASE NEW.medal
      WHEN 'like' THEN 2
      WHEN 'cheer' THEN 3
      ELSE 0
    END;
    target_user_id := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    xp_delta := CASE OLD.medal
      WHEN 'like' THEN 2
      WHEN 'cheer' THEN 3
      ELSE 0
    END;
    target_user_id := OLD.user_id;
    xp_delta := xp_delta * -1;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF xp_delta <> 0 THEN
    UPDATE public.profiles
    SET xp = GREATEST(0, xp + xp_delta)
    WHERE user_id = target_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_profile_xp_from_reaction ON public.reactions;

CREATE TRIGGER trg_adjust_profile_xp_from_reaction
AFTER INSERT OR DELETE ON public.reactions
FOR EACH ROW
EXECUTE FUNCTION public.adjust_profile_xp_from_reaction();