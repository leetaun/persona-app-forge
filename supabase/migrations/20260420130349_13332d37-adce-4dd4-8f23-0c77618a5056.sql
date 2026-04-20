CREATE OR REPLACE FUNCTION public.compute_level_from_xp(_xp integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _xp >= 1001 THEN 5
    WHEN _xp >= 601 THEN 4
    WHEN _xp >= 301 THEN 3
    WHEN _xp >= 101 THEN 2
    ELSE 1
  END
$$;