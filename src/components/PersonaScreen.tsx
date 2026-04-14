import { motion } from "framer-motion";
import { Gem, Landmark, Sun, ChevronRight } from "lucide-react";

const personas = [
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    subtitle: "Du lịch Bí ẩn",
    description: "Khám phá những địa điểm độc đáo chỉ người bản địa mới biết",
    icon: Gem,
    gradient: "from-emerald-500 to-teal-600",
    bgClass: "bg-secondary",
  },
  {
    id: "spiritual",
    title: "Check-in Tâm linh",
    subtitle: "Văn hóa & Lịch sử",
    description: "Tập trung vào đền, chùa và các di tích lịch sử cổ",
    icon: Landmark,
    gradient: "from-amber-500 to-orange-600",
    bgClass: "bg-accent/10",
  },
  {
    id: "golden-hour",
    title: "Săn ảnh Giờ vàng",
    subtitle: "Kiến trúc & Ánh sáng",
    description: "Gợi ý địa điểm có ánh sáng lý tưởng theo từng khung giờ",
    icon: Sun,
    gradient: "from-yellow-400 to-amber-500",
    bgClass: "bg-xp/5",
  },
];

const PersonaScreen = () => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Gợi ý Khám phá</h1>
        <p className="text-sm text-muted-foreground mb-6">Chọn phong cách hành trình của bạn</p>
      </motion.div>

      <div className="space-y-4">
        {personas.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`w-full ${p.bgClass} rounded-2xl p-5 text-left border border-border/50 shadow-sm hover:shadow-md transition-all active:scale-[0.98]`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center flex-shrink-0`}>
                <p.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{p.title}</h3>
                    <p className="text-xs text-primary font-medium">{p.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{p.description}</p>
              </div>
            </div>
          </motion.button>
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
          Bạn có thể đổi phong cách khám phá bất cứ lúc nào. Mỗi phong cách sẽ mở ra những nhiệm vụ và địa điểm khác nhau!
        </p>
      </motion.div>
    </div>
  );
};

export default PersonaScreen;
