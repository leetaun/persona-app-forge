// Level thresholds (min XP required for that level)
export const LEVEL_THRESHOLDS = [0, 101, 301, 601, 1001] as const;

export const LEVEL_NAMES: Record<number, string> = {
  1: "Người Mới",
  2: "Lữ Khách",
  3: "Nhà Khám Phá",
  4: "Bậc Thầy Hành Trình",
  5: "Huyền Thoại Jourstic",
};

export const computeLevel = (xp: number): number => {
  let lvl = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
  }
  return lvl;
};

export const xpToNextLevel = (xp: number): { current: number; next: number | null; name: string } => {
  const lvl = computeLevel(xp);
  const next = LEVEL_THRESHOLDS[lvl] ?? null; // threshold for level lvl+1
  return { current: lvl, next, name: LEVEL_NAMES[lvl] ?? `Lv ${lvl}` };
};

export const levelName = (lvl: number) => LEVEL_NAMES[lvl] ?? `Lv ${lvl}`;
