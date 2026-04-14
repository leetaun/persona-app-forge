import { motion } from "framer-motion";
import { Award, Star, Gift, ChevronRight, Zap } from "lucide-react";

const badges = [
  { id: 1, name: "Hành trình Tình yêu", emoji: "❤️", earned: true, color: "from-rose-400 to-pink-500" },
  { id: 2, name: "Huy chương Tâm linh", emoji: "🏛️", earned: true, color: "from-amber-400 to-orange-500" },
  { id: 3, name: "Huy chương Lịch sử", emoji: "📜", earned: true, color: "from-emerald-400 to-teal-500" },
  { id: 4, name: "Nhiếp ảnh gia", emoji: "📸", earned: false, color: "from-blue-400 to-indigo-500" },
  { id: 5, name: "Nhà thám hiểm", emoji: "🧭", earned: false, color: "from-purple-400 to-violet-500" },
  { id: 6, name: "Bậc thầy Fog", emoji: "🌫️", earned: false, color: "from-gray-400 to-slate-500" },
];

const vouchers = [
  { id: 1, name: "Cà phê Trung Nguyên", discount: "-30%", expiry: "30/04/2026" },
  { id: 2, name: "Cafe Trống Đồng", discount: "Miễn phí", expiry: "15/05/2026" },
];

const AchievementsScreen = () => {
  const xp = 2450;
  const nextLevel = 3000;
  const level = 12;

  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Thành tựu</h1>
        <p className="text-sm text-muted-foreground mb-6">Explorer's Vault</p>
      </motion.div>

      {/* XP Card */}
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
            animate={{ width: `${(xp / nextLevel) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
        <p className="text-primary-foreground/70 text-xs">{nextLevel - xp} XP để lên Level {level + 1}</p>
      </motion.div>

      {/* Badges */}
      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" /> Huy chương
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-2xl p-3 text-center border ${
              badge.earned
                ? "bg-card border-primary/20 shadow-sm"
                : "bg-muted/50 border-border/30 opacity-50"
            }`}
          >
            <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
              badge.earned ? `bg-gradient-to-br ${badge.color}` : "bg-muted"
            }`}>
              <span className="text-xl">{badge.emoji}</span>
            </div>
            <p className="text-[10px] font-semibold text-foreground leading-tight">{badge.name}</p>
          </motion.div>
        ))}
      </div>

      {/* Vouchers */}
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
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{v.name}</p>
              <p className="text-[10px] text-muted-foreground">HSD: {v.expiry}</p>
            </div>
            <div className="flex items-center gap-1">
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
