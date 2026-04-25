import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Star, Clock, Landmark, UtensilsCrossed, Palette, BedDouble } from "lucide-react";

// Thêm "pillars" vào type
export type SuggestionCategory = "culture" | "food" | "art" | "rest" | "pillars";

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
  culture: {
    title: "Văn hóa - Tâm linh",
    subtitle: "Đền, chùa & di tích cổ",
    icon: Landmark,
    places: [
      {
        id: 1,
        name: "Đền Quán Thánh",
        area: "Ba Đình, Hà Nội",
        description: "Một trong Thăng Long Tứ Trấn, thờ Huyền Thiên Trấn Vũ với tượng đồng đen nổi tiếng.",
        rating: 4.6,
        time: "45 phút",
        tag: "Tứ Trấn",
        image: "🗿",
      },
      {
        id: 2,
        name: "Chùa Một Cột",
        area: "Ba Đình, Hà Nội",
        description: "Kiến trúc độc đáo hình bông sen vươn lên từ mặt hồ — biểu tượng của Hà Nội.",
        rating: 4.7,
        time: "30 phút",
        tag: "Biểu tượng",
        image: "🪷",
      },
      {
        id: 3,
        name: "Chùa Bát Tháp",
        area: "Ba Đình, Hà Nội",
        description: "Ngôi chùa cổ kính với tám ngọn tháp đặc trưng, không gian thanh tịnh giữa lòng phố.",
        rating: 4.4,
        time: "45 phút",
        tag: "Chùa cổ",
        image: "🛕",
      },
      {
        id: 4,
        name: "Chùa Am Cửa Bắc",
        area: "Ba Đình, Hà Nội",
        description: "Ngôi am nhỏ linh thiêng gần Cửa Bắc thành cổ, mang đậm dấu ấn lịch sử Thăng Long.",
        rating: 4.3,
        time: "30 phút",
        tag: "Am cổ",
        image: "⛩️",
      },
    ],
  },
  food: {
    title: "Ẩm thực",
    subtitle: "Nhà hàng & quán ngon",
    icon: UtensilsCrossed,
    places: [
      {
        id: 1,
        name: "Lẩu hơi Cosmos",
        area: "Giảng Võ, Hà Nội",
        description: "Lẩu hơi kiểu Quảng Đông tươi ngon, không gian sang trọng phù hợp tụ tập gia đình.",
        rating: 4.6,
        time: "1-2 giờ",
        tag: "Lẩu hơi",
        image: "🍲",
      },
      {
        id: 2,
        name: "Old Hanoi Restaurant",
        area: "Tôn Thất Thuyết, Hà Nội",
        description: "Nhà hàng phong cách Hà Nội xưa với các món ăn truyền thống đậm đà, không gian hoài cổ.",
        rating: 4.5,
        time: "1-2 giờ",
        tag: "Truyền thống",
        image: "🍜",
      },
      {
        id: 3,
        name: "Meat Plus",
        area: "Giảng Võ, Hà Nội",
        description: "Thiên đường thịt nướng kiểu Hàn Quốc, chất lượng thịt cao cấp, phục vụ chuyên nghiệp.",
        rating: 4.7,
        time: "1-2 giờ",
        tag: "BBQ Hàn",
        image: "🥩",
      },
      {
        id: 4,
        name: "Hatoyama",
        area: "Điện Biên Phủ, Hà Nội",
        description: "Nhà hàng Nhật Bản chuẩn vị với sushi, sashimi tươi và không gian yên tĩnh.",
        rating: 4.6,
        time: "1-2 giờ",
        tag: "Nhật Bản",
        image: "🍣",
      },
    ],
  },
  art: {
    title: "Nghệ thuật",
    subtitle: "Bảo tàng & di sản",
    icon: Palette,
    places: [
      {
        id: 1,
        name: "Cột cờ Hà Nội",
        area: "Ba Đình, Hà Nội",
        description: "Biểu tượng lịch sử trên 200 năm tuổi, điểm cao ngắm toàn cảnh khu vực Ba Đình.",
        rating: 4.6,
        time: "1 giờ",
        tag: "Di tích",
        image: "🚩",
      },
      {
        id: 2,
        name: "Bảo tàng Mỹ thuật Việt Nam",
        area: "Ba Đình, Hà Nội",
        description: "Bộ sưu tập hội họa, điêu khắc tiêu biểu của mỹ thuật Việt qua các thời kỳ.",
        rating: 4.7,
        time: "2 giờ",
        tag: "Bảo tàng",
        image: "🎨",
      },
      {
        id: 3,
        name: "Quảng trường Ba Đình",
        area: "Ba Đình, Hà Nội",
        description: "Nơi Bác Hồ đọc Tuyên ngôn Độc lập, không gian rộng lớn mang ý nghĩa lịch sử thiêng liêng.",
        rating: 4.8,
        time: "1 giờ",
        tag: "Lịch sử",
        image: "🏛️",
      },
      {
        id: 4,
        name: "Hoàng thành Thăng Long",
        area: "Ba Đình, Hà Nội",
        description: "Di sản thế giới UNESCO, kinh đô ngàn năm với nhiều dấu tích kiến trúc cung đình.",
        rating: 4.7,
        time: "2-3 giờ",
        tag: "UNESCO",
        image: "🏯",
      },
    ],
  },
  rest: {
    title: "Nghỉ ngơi",
    subtitle: "Khách sạn & resort",
    icon: BedDouble,
    places: [
      {
        id: 1,
        name: "Nature Hotel and Spa Hanoi",
        area: "Hà Nội",
        description: "Khách sạn xanh mát với dịch vụ spa thư giãn, không gian gần gũi thiên nhiên.",
        rating: 4.5,
        time: "Lưu trú",
        tag: "Spa",
        image: "🌿",
      },
      {
        id: 2,
        name: "Vinhomes Metropolis Harmony",
        area: "Liễu Giai, Hà Nội",
        description: "Căn hộ dịch vụ cao cấp với view thành phố, đầy đủ tiện nghi 5 sao.",
        rating: 4.7,
        time: "Lưu trú",
        tag: "Cao cấp",
        image: "🏙️",
      },
      {
        id: 3,
        name: "Le Jardin Hotel Haute Couture",
        area: "Hà Nội",
        description: "Boutique hotel phong cách Pháp tinh tế, không gian lãng mạn đậm chất nghệ thuật.",
        rating: 4.6,
        time: "Lưu trú",
        tag: "Boutique",
        image: "🏨",
      },
      {
        id: 4,
        name: "Anise Hotel & Spa Hanoi",
        area: "Hà Nội",
        description: "Khách sạn 4 sao trung tâm với spa thư giãn, dịch vụ chu đáo, vị trí thuận tiện.",
        rating: 4.5,
        time: "Lưu trú",
        tag: "4 sao",
        image: "🛏️",
      },
    ],
  },
  pillars: {
    title: "Trạm Thám Hiểm",
    subtitle: "Cột mốc quét mã QR trên bản đồ",
    icon: MapPin,
    places: [
      {
        id: 1,
        name: "49 Thanh Niên",
        area: "Tây Hồ, Hà Nội",
        description: "Trạm thám hiểm trên đường Thanh Niên ven hồ. Hãy đến gần để quét mã và nhận thử thách.",
        rating: 4.8,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "🌊",
      },
      {
        id: 2,
        name: "Quảng Bá",
        area: "Tây Hồ, Hà Nội",
        description: "Trạm thám hiểm khu vực Quảng Bá. Hoàn thành nhiệm vụ để nhận ngay XP.",
        rating: 4.7,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "🌸",
      },
      {
        id: 3,
        name: "69 Tô Ngọc Vân",
        area: "Tây Hồ, Hà Nội",
        description: "Điểm quét QR ẩn giấu tại đường Tô Ngọc Vân. Khám phá không gian đặc trưng nơi đây.",
        rating: 4.6,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "📍",
      },
      {
        id: 4,
        name: "Ngõ 3 Quảng Bá",
        area: "Tây Hồ, Hà Nội",
        description: "Trạm thám hiểm nằm trong ngõ 3 Quảng Bá. Tìm đúng vị trí để mở khóa cột mốc.",
        rating: 4.5,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "🗺️",
      },
      {
        id: 5,
        name: "Ngã 3 Nhật Chiêu",
        area: "Tây Hồ, Hà Nội",
        description: "Cột mốc check-in tại Ngã 3 Nhật Chiêu. Quét mã QR để vượt qua thử thách khu vực này.",
        rating: 4.7,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "⛩️",
      },
      {
        id: 6,
        name: "Vệ Hồ",
        area: "Tây Hồ, Hà Nội",
        description: "Trạm thám hiểm dọc theo đường Vệ Hồ. Cảnh quan mặt nước và không gian thoáng đãng.",
        rating: 4.8,
        time: "15-20 phút",
        tag: "Check-in QR",
        image: "🌅",
      },
      {
        id: 7,
        name: "Cột cờ Hà Nội",
        area: "Ba Đình, Hà Nội",
        description: "Trạm thám hiểm lịch sử nổi tiếng. Quét mã QR để trả lời câu hỏi về di tích này.",
        rating: 4.9,
        time: "15-20 phút",
        tag: "Check-in QR",
        image: "🚩",
      },
      {
        id: 8,
        name: "Đường Độc Lập",
        area: "Ba Đình, Hà Nội",
        description: "Cột mốc nằm trên tuyến phố Độc Lập trang nghiêm. Đến gần và sẵn sàng quét mã.",
        rating: 4.8,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "🏛️",
      },
      {
        id: 9,
        name: "Đường Phan Đình Phùng",
        area: "Ba Đình, Hà Nội",
        description: "Trạm thám hiểm trên con đường rợp bóng cây xanh đẹp nhất thủ đô.",
        rating: 4.9,
        time: "15-20 phút",
        tag: "Check-in QR",
        image: "🌳",
      },
      {
        id: 10,
        name: "Kamon Cafe",
        area: "Ba Đình, Hà Nội",
        description: "Điểm quét QR ẩn giấu tại quán Cafe có kiến trúc độc đáo. Nhận ngay XP khi hoàn thành.",
        rating: 4.8,
        time: "10-15 phút",
        tag: "Check-in QR",
        image: "☕",
      }
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
