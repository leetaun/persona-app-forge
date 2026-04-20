import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Star, Gift, ChevronRight, Zap, LogOut, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { computeLevel, LEVEL_NAMES, LEVEL_THRESHOLDS, levelName } from "@/lib/levels";

interface Voucher {
  id: string;
  title: string;
  partner: string | null;
  discount: string | null;
  expires_at: string | null;
}

// Badges defined per-level (client-side, tied to level system)
const LEVEL_BADGES = [
  { level: 1, name: "Người Mới", icon: "🌱", gradient: "from-emerald-400 to-teal-500" },
  { level: 2, name: "Lữ Khách", icon: "🧭", gradient: "from-blue-400 to-indigo-500" },
  { level: 3, name: "Nhà Khám Phá", icon: "🗺️", gradient: "from-purple-400 to-fuchsia-500" },
  { level: 4, name: "Bậc Thầy", icon: "👑", gradient: "from-amber-400 to-orange-500" },
  { level: 5, name: "Huyền Thoại", icon: "🏆", gradient: "from-rose-400 to-pink-600" },
];

const AchievementsScreen = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    supabase
      .from("vouchers")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => setVouchers((data as Voucher[]) || []));
  }, [user]);

  const xp = profile?.xp ?? 0;
  const currentLevel = computeLevel(xp);
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] ?? null; // threshold for level+1
  const prevThreshold = LEVEL_THRESHOLDS[currentLevel - 1] ?? 0;
  const xpInLevel = xp - prevThreshold;
  const xpRange = nextThreshold ? nextThreshold - prevThreshold : 1;
  const progress = nextThreshold ? Math.min(100, (xpInLevel / xpRange) * 100) : 100;

  // Map vouchers to required level by index (1->Lv2, 2->Lv3, ...)
  const requiredLevelFor = (idx: number) => Math.min(5, idx + 2);

  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <div className="flex items-start justify-between mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Thành tựu</h1>
          <p className="text-sm text-muted-foreground">
            Xin chào, {profile?.display_name ?? user?.email ?? "Explorer"}
          </p>
        </motion.div>
        <button
          onClick={signOut}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-primary to-emerald-600 rounded-2xl p-5 mb-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-foreground" />
            <span className="text-primary-foreground font-bold">
              Lv {currentLevel} · {levelName(currentLevel)}
            </span>
          </div>
          <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1">
            <Star className="w-3 h-3 text-xp fill-xp" />
            <span className="text-primary-foreground text-xs font-bold">{xp} XP</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-primary-foreground/20 overflow-hidden mb-2 mt-3">
          <motion.div
            className="h-full rounded-full bg-primary-foreground/80"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-primary-foreground/70 text-xs">
          {nextThreshold
            ? `${nextThreshold - xp} XP để lên ${LEVEL_NAMES[currentLevel + 1] ?? `Lv ${currentLevel + 1}`}`
            : "Bạn đã đạt cấp tối đa! 🏆"}
        </p>
      </motion.div>

      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" /> Huy hiệu cấp độ ({currentLevel}/5)
      </h2>
      <div className="grid grid-cols-5 gap-2 mb-6">
        {LEVEL_BADGES.map((badge, i) => {
          const earned = currentLevel >= badge.level;
          return (
            <motion.div
              key={badge.level}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-2 text-center border ${
                earned ? "bg-card border-primary/20 shadow-sm" : "bg-muted/40 border-border/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl mx-auto mb-1 flex items-center justify-center ${
                  earned ? `bg-gradient-to-br ${badge.gradient}` : "bg-muted grayscale"
                }`}
              >
                <span className="text-lg">{earned ? badge.icon : "🔒"}</span>
              </div>
              <p className="text-[9px] font-semibold text-foreground leading-tight">
                Lv{badge.level}
              </p>
              <p className="text-[8px] text-muted-foreground leading-tight truncate">
                {badge.name}
              </p>
            </motion.div>
          );
        })}
      </div>

      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-accent" /> Kho Voucher
      </h2>
      <div className="space-y-3">
        {vouchers.map((v, i) => {
          const required = requiredLevelFor(i);
          const unlocked = currentLevel >= required;
          return (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className={`bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 shadow-sm ${
                unlocked ? "" : "grayscale opacity-60"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                {unlocked ? (
                  <Gift className="w-5 h-5 text-accent" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{v.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {unlocked
                    ? `${v.partner ?? ""}${v.expires_at ? ` • HSD: ${new Date(v.expires_at).toLocaleDateString("vi-VN")}` : ""}`
                    : `Đạt Lv${required} (${LEVEL_NAMES[required]}) để mở khóa`}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-primary">{v.discount}</span>
                {unlocked && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsScreen;
