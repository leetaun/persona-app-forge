import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Star, Gift, ChevronRight, Zap, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  rarity: string;
}

interface Voucher {
  id: string;
  title: string;
  partner: string | null;
  discount: string | null;
  expires_at: string | null;
}

const rarityGradient: Record<string, string> = {
  common: "from-emerald-400 to-teal-500",
  rare: "from-blue-400 to-indigo-500",
  epic: "from-purple-400 to-fuchsia-500",
  legendary: "from-amber-400 to-orange-500",
};

const AchievementsScreen = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [vouchers, setVouchers] = useState<Voucher[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: badgesData }, { data: userBadges }, { data: vouchersData }] = await Promise.all([
        supabase.from("badges").select("*"),
        user ? supabase.from("user_badges").select("badge_id").eq("user_id", user.id) : Promise.resolve({ data: [] as any[] }),
        supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
      ]);
      setBadges((badgesData as Badge[]) || []);
      setEarnedIds(new Set(((userBadges as any[]) || []).map((b) => b.badge_id)));
      setVouchers((vouchersData as Voucher[]) || []);
    };
    load();
  }, [user]);

  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;

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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-foreground" />
            <span className="text-primary-foreground font-bold">Level {level}</span>
          </div>
          <div className="flex items-center gap-1 bg-primary-foreground/20 rounded-full px-3 py-1">
            <Star className="w-3 h-3 text-xp fill-xp" />
            <span className="text-primary-foreground text-xs font-bold">{xp} XP</span>
          </div>
        </div>
        <div className="h-2 rounded-full bg-primary-foreground/20 overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full bg-primary-foreground/80"
            initial={{ width: 0 }}
            animate={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-primary-foreground/70 text-xs">
          {xpToNext - xpInLevel} XP để lên Level {level + 1}
        </p>
      </motion.div>

      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" /> Huy chương ({earnedIds.size}/{badges.length})
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {badges.map((badge, i) => {
          const earned = earnedIds.has(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl p-3 text-center border ${
                earned ? "bg-card border-primary/20 shadow-sm" : "bg-muted/50 border-border/30 opacity-60"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                  earned ? `bg-gradient-to-br ${rarityGradient[badge.rarity] ?? rarityGradient.common}` : "bg-muted"
                }`}
              >
                <span className="text-xl">{badge.icon ?? "🏅"}</span>
              </div>
              <p className="text-[10px] font-semibold text-foreground leading-tight">{badge.name}</p>
            </motion.div>
          );
        })}
      </div>

      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-accent" /> Kho Voucher
      </h2>
      <div className="space-y-3">
        {vouchers.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{v.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {v.partner} {v.expires_at && `• HSD: ${new Date(v.expires_at).toLocaleDateString("vi-VN")}`}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-sm font-bold text-primary">{v.discount}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsScreen;
