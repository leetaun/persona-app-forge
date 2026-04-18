import { motion } from "framer-motion";
import { Gem, Landmark, Sun, ChevronRight } from "lucide-react";

type PersonaId = "hidden_gems" | "spiritual" | "golden_hour";

const personas = [
  {
    id: "hidden_gems" as PersonaId,
    title: "Hidden Gems",
    subtitle: "Du lịch Bí ẩn",
    description: "Khám phá những địa điểm độc đáo chỉ người bản địa mới biết",
    icon: Gem,
    gradient: "from-emerald-500 to-teal-600",
    bgClass: "bg-secondary",
  },
  {
    id: "spiritual" as PersonaId,
    title: "Check-in Tâm linh",
    subtitle: "Văn hóa & Lịch sử",
    description: "Tập trung vào đền, chùa và các di tích lịch sử cổ",
    icon: Landmark,
    gradient: "from-amber-500 to-orange-600",
    bgClass: "bg-accent/10",
  },
  {
    id: "golden_hour" as PersonaId,
    title: "Săn ảnh Giờ vàng",
    subtitle: "Kiến trúc & Ánh sáng",
    description: "Gợi ý địa điểm có ánh sáng lý tưởng theo từng khung giờ",
    icon: Sun,
    gradient: "from-yellow-400 to-amber-500",
    bgClass: "bg-xp/5",
  },
];

interface PersonaScreenProps {
  onOpenPersona?: (id: PersonaId) => void;
}

const PersonaScreen = ({ onOpenPersona }: PersonaScreenProps) => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Gợi ý Khám phá</h1>
        <p className="text-sm text-muted-foreground mb-6">Chọn phong cách hành trình để xem địa điểm gợi ý</p>
      </motion.div>

      <div className="space-y-4">
        {personas.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`w-full ${p.bgClass} rounded-2xl p-5 text-left border border-border/50 shadow-sm`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center flex-shrink-0`}
              >
                <p.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{p.title}</h3>
                <p className="text-xs text-primary font-medium">{p.subtitle}</p>
                <p className="text-sm text-muted-foreground mt-1.5">{p.description}</p>
                <button
                  onClick={() => onOpenPersona?.(p.id)}
                  className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Xem danh sách <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-4 rounded-2xl border border-primary/20 bg-primary/5"
      >
        <p className="text-xs font-semibold text-primary mb-1">💡 Mẹo</p>
        <p className="text-xs text-muted-foreground">
          Mỗi phong cách mở ra danh sách địa điểm khác nhau giúp bạn lên lịch trình nhanh hơn.
        </p>
      </motion.div>
    </div>
  );
};

export default PersonaScreen;
