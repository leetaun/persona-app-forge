import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Clock, Sparkles } from "lucide-react";

const hiddenGems = [
  {
    id: 1,
    name: "Làng cổ Đường Lâm",
    area: "Sơn Tây, Hà Nội",
    description: "Làng cổ duy nhất ở Việt Nam được công nhận di tích quốc gia, với những ngôi nhà đá ong hàng trăm năm tuổi.",
    rating: 4.7,
    time: "Cả ngày",
    tag: "Làng cổ",
    image: "🏘️",
  },
  {
    id: 2,
    name: "Phố bích họa Phùng Hưng",
    area: "Hoàn Kiếm, Hà Nội",
    description: "Con phố nghệ thuật với những bức tranh tường 3D tái hiện đời sống Hà Nội xưa dưới các vòm cầu cổ.",
    rating: 4.5,
    time: "1-2 giờ",
    tag: "Nghệ thuật",
    image: "🎨",
  },
  {
    id: 3,
    name: "Làng gốm Bát Tràng",
    area: "Gia Lâm, Hà Nội",
    description: "Làng nghề gốm sứ 700 năm tuổi, nơi bạn có thể tự tay nặn và tráng men sản phẩm riêng.",
    rating: 4.6,
    time: "Nửa ngày",
    tag: "Làng nghề",
    image: "🏺",
  },
  {
    id: 4,
    name: "Phố cà phê đường tàu",
    area: "Hoàn Kiếm, Hà Nội",
    description: "Trải nghiệm uống cà phê ngay sát đường ray tàu hỏa chạy xuyên qua khu phố cổ.",
    rating: 4.3,
    time: "1-2 giờ",
    tag: "Độc lạ",
    image: "🚂",
  },
  {
    id: 5,
    name: "Chợ Long Biên",
    area: "Ba Đình, Hà Nội",
    description: "Chợ đầu mối đêm lớn nhất Hà Nội, nhộn nhịp từ 2h sáng — thiên đường cho nhiếp ảnh gia.",
    rating: 4.4,
    time: "Đêm khuya",
    tag: "Trải nghiệm đêm",
    image: "🌙",
  },
  {
    id: 6,
    name: "Hồ Quảng Bá & đường hoa",
    area: "Tây Hồ, Hà Nội",
    description: "Con đường ven hồ yên tĩnh với những vườn hoa sen, đào, quất theo mùa — bí mật của dân local.",
    rating: 4.5,
    time: "Buổi sáng",
    tag: "Thiên nhiên",
    image: "🌸",
  },
  {
    id: 7,
    name: "Ngõ 47 Hàng Bạc",
    area: "Hoàn Kiếm, Hà Nội",
    description: "Ngõ nhỏ ẩn giấu ngôi nhà cổ 200 năm với kiến trúc truyền thống Hà Nội nguyên vẹn.",
    rating: 4.2,
    time: "30 phút",
    tag: "Di sản",
    image: "🏛️",
  },
  {
    id: 8,
    name: "Đảo Ngọc - Đền Ngọc Sơn",
    area: "Hoàn Kiếm, Hà Nội",
    description: "Không chỉ là đền thờ, hãy khám phá góc khuất yên bình phía sau đảo lúc sáng sớm.",
    rating: 4.8,
    time: "1 giờ",
    tag: "Tâm linh",
    image: "⛩️",
  },
];

interface HiddenGemsScreenProps {
  onBack: () => void;
}

const HiddenGemsScreen = ({ onBack }: HiddenGemsScreenProps) => {
  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
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
              <Sparkles className="w-4 h-4 text-primary" />
              Hidden Gems Hà Nội
            </h1>
            <p className="text-xs text-muted-foreground">{hiddenGems.length} địa điểm bí ẩn</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 pb-28 space-y-3">
        {hiddenGems.map((gem, i) => (
          <motion.div
            key={gem.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-secondary rounded-2xl p-4 border border-border/50 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-3">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                {gem.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-foreground text-sm leading-tight">{gem.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">
                    {gem.tag}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{gem.area}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{gem.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-xp fill-xp" />
                    <span className="text-xs font-semibold text-foreground">{gem.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{gem.time}</span>
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

export default HiddenGemsScreen;
