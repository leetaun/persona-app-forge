import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Clock, Sparkles, Landmark, Sun } from "lucide-react";

export type SuggestionCategory = "spiritual" | "golden_hour";

interface Place {
  id: number;
  name: string;
  area: string;
  description: string;
  rating: number;
  time: string;
  tag: string;
  image: string;
}

const DATA: Record<SuggestionCategory, { title: string; subtitle: string; icon: typeof Landmark; places: Place[] }> = {
  spiritual: {
    title: "Check-in Tâm linh",
    subtitle: "Đền, chùa & di tích cổ",
    icon: Landmark,
    places: [
      {
        id: 1,
        name: "Chùa Trấn Quốc",
        area: "Tây Hồ, Hà Nội",
        description: "Ngôi chùa cổ nhất Hà Nội (hơn 1500 năm), nằm trên đảo nhỏ giữa Hồ Tây thơ mộng.",
        rating: 4.8,
        time: "1-2 giờ",
        tag: "Chùa cổ",
        image: "🛕",
      },
      {
        id: 2,
        name: "Đền Ngọc Sơn",
        area: "Hoàn Kiếm, Hà Nội",
        description: "Đền linh thiêng trên đảo Ngọc giữa Hồ Gươm, biểu tượng văn hoá của thủ đô.",
        rating: 4.7,
        time: "1 giờ",
        tag: "Đền",
        image: "⛩️",
      },
      {
        id: 3,
        name: "Văn Miếu - Quốc Tử Giám",
        area: "Đống Đa, Hà Nội",
        description: "Trường đại học đầu tiên của Việt Nam, thờ Khổng Tử và các danh nho.",
        rating: 4.6,
        time: "2 giờ",
        tag: "Di tích",
        image: "🏛️",
      },
      {
        id: 4,
        name: "Chùa Một Cột",
        area: "Ba Đình, Hà Nội",
        description: "Kiến trúc độc đáo hình bông sen vươn lên từ mặt hồ — biểu tượng của Hà Nội.",
        rating: 4.5,
        time: "30 phút",
        tag: "Biểu tượng",
        image: "🪷",
      },
      {
        id: 5,
        name: "Đền Quán Thánh",
        area: "Ba Đình, Hà Nội",
        description: "Một trong Thăng Long Tứ Trấn, thờ Huyền Thiên Trấn Vũ với tượng đồng đen nổi tiếng.",
        rating: 4.5,
        time: "45 phút",
        tag: "Tứ Trấn",
        image: "🗿",
      },
      {
        id: 6,
        name: "Phủ Tây Hồ",
        area: "Tây Hồ, Hà Nội",
        description: "Nơi thờ Mẫu Liễu Hạnh, điểm hành hương nổi tiếng đầu năm của người Hà Nội.",
        rating: 4.4,
        time: "1 giờ",
        tag: "Phủ Mẫu",
        image: "🏯",
      },
    ],
  },
  golden_hour: {
    title: "Săn ảnh Giờ vàng",
    subtitle: "Kiến trúc & Ánh sáng",
    icon: Sun,
    places: [
      {
        id: 1,
        name: "Cầu Long Biên",
        area: "Long Biên, Hà Nội",
        description: "Cây cầu thép cổ 120 năm tuổi, đẹp nhất khi mặt trời lặn rọi qua khung sắt.",
        rating: 4.7,
        time: "Hoàng hôn 17:30",
        tag: "Hoàng hôn",
        image: "🌉",
      },
      {
        id: 2,
        name: "Hồ Tây - Đường Thanh Niên",
        area: "Tây Hồ, Hà Nội",
        description: "Bình minh phản chiếu trên mặt hồ, chân trời ửng hồng giữa hai hồ Tây và Trúc Bạch.",
        rating: 4.6,
        time: "Bình minh 5:30",
        tag: "Bình minh",
        image: "🌅",
      },
      {
        id: 3,
        name: "Nhà thờ Lớn Hà Nội",
        area: "Hoàn Kiếm, Hà Nội",
        description: "Kiến trúc Gothic Pháp lung linh dưới ánh đèn vàng buổi tối, lý tưởng chụp blue hour.",
        rating: 4.5,
        time: "Blue hour 18:00",
        tag: "Blue hour",
        image: "⛪",
      },
      {
        id: 4,
        name: "Phố cổ - Phố Hàng Mã",
        area: "Hoàn Kiếm, Hà Nội",
        description: "Đèn lồng và sắc màu rực rỡ về đêm, thiên đường ảnh đường phố.",
        rating: 4.5,
        time: "Tối 19:00-22:00",
        tag: "Đường phố",
        image: "🏮",
      },
      {
        id: 5,
        name: "Lăng Bác - Quảng trường Ba Đình",
        area: "Ba Đình, Hà Nội",
        description: "Kiến trúc đối xứng hùng vĩ, ánh sáng vàng buổi sáng sớm tạo bóng đẹp.",
        rating: 4.6,
        time: "Sáng sớm 6:30",
        tag: "Kiến trúc",
        image: "🏛️",
      },
      {
        id: 6,
        name: "Cầu Nhật Tân",
        area: "Tây Hồ, Hà Nội",
        description: "Cầu dây văng 5 trụ tháp đổi màu rực rỡ về đêm, view sông Hồng cực ảo.",
        rating: 4.7,
        time: "Tối 20:00",
        tag: "Đèn LED",
        image: "🌃",
      },
    ],
  },
};

interface Props {
  category: SuggestionCategory;
  onBack: () => void;
}

const SuggestionsScreen = ({ category, onBack }: Props) => {
  const cfg = DATA[category];
  const Icon = cfg.icon;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 pt-14">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-1.5">
              <Icon className="w-4 h-4 text-primary" />
              {cfg.title}
            </h1>
            <p className="text-xs text-muted-foreground">{cfg.places.length} địa điểm gợi ý · {cfg.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 pb-28 space-y-3">
        {cfg.places.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-secondary rounded-2xl p-4 border border-border/50 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {p.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm leading-tight">{p.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">
                    {p.tag}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{p.area}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-xp fill-xp" />
                    <span className="text-xs font-semibold text-foreground">{p.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{p.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SuggestionsScreen;
