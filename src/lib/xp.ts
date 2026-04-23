export const LOCATION_XP_BY_AREA: Record<string, number> = {
  "Văn hóa - Tâm linh": 100,
  "Nghệ thuật": 80,
  "Nghỉ ngơi": 50,
  "Ẩm thực": 20,
};

export const getLocationXpByArea = (area: string | null | undefined) => {
  if (!area) return 0;
  return LOCATION_XP_BY_AREA[area] ?? 0;
};

export const getCheckpointXp = <T extends { area?: string | null; xp_reward?: number | null }>(
  checkpoint: T | null | undefined,
) => {
  if (!checkpoint) return 0;
  return getLocationXpByArea(checkpoint.area) || checkpoint.xp_reward || 0;
};