import { motion } from "framer-motion";
// Thêm MapPin vào bộ icon
import { Landmark, UtensilsCrossed, Palette, BedDouble, ChevronRight, MapPin } from "lucide-react";

// Thêm "pillars" vào type
type PersonaId = "culture" | "food" | "art" | "rest" | "pillars";

const personas = [
  {
    id: "culture" as PersonaId,
    title: "Văn hóa - Tâm linh",
    subtitle: "Đền, chùa & di tích",
    description: "Khám phá các đền, chùa cổ kính và di tích lịch sử của Thăng Long",
    icon: Landmark,
    gradient: "from-amber-500 to-orange-600",
    bgClass: "bg-accent/10",
  },
  {
    id: "food" as PersonaId,
    title: "Ẩm thực",
    subtitle: "Nhà hàng & quán ngon",
    description: "Những địa chỉ ăn uống được yêu thích nhất Hà Nội",
    icon: UtensilsCrossed,
    gradient: "from-rose-500 to-red-600",
    bgClass: "bg-secondary",
  },
  {
    id: "art" as PersonaId,
    title: "Nghệ thuật",
    subtitle: "Bảo tàng & di sản",
    description: "Trải nghiệm các không gian nghệ thuật, bảo tàng và di tích lịch sử",
    icon: Palette,
    gradient: "from-violet-500 to-purple-600",
    bgClass: "bg-primary/5",
  },
  {
    id: "rest" as PersonaId,
    title: "Nghỉ ngơi",
    subtitle: "Khách sạn & spa",
    description: "Lựa chọn lưu trú thoải mái và thư giãn giữa lòng thủ đô",
    icon: BedDouble,
    gradient: "from-emerald-500 to-teal-600",
    bgClass: "bg-xp/5",
  },
  // DANH MỤC MỚI THÊM VÀO ĐÂY:
  {
    id: "pillars" as PersonaId,
    title: "Trạm Thám Hiểm",
    subtitle: "Cột mốc quét mã QR",
    description: "Danh sách các trạm thám hiểm bạn cần tìm và quét mã trên bản đồ 3D",
    icon: MapPin,
    gradient: "from-blue-500 to-indigo-600",
    bgClass: "bg-blue-500/5",
  },
];

interface PersonaScreenProps {
  onOpenPersona?: (id: PersonaId) => void;
}

const PersonaScreen = ({ onOpenPersona }: PersonaScreenProps) => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Khám phá</h1>
        <p className="text-sm text-muted-foreground mb-6">Chọn danh mục để xem các địa điểm gợi ý</p>
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
    </div>
  );
};

export default PersonaScreen;
