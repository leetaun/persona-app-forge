import { motion } from "framer-motion";
import { Heart, Award, MapPin, Clock, MessageCircle } from "lucide-react";
import hoGuomImg from "@/assets/ho-guom.png";
import vanMieuImg from "@/assets/van-mieu.png";

const feedItems = [
  {
    id: 1,
    user: "Minh Anh",
    avatar: "MA",
    location: "Hồ Hoàn Kiếm",
    time: "5 phút trước",
    caption: "Buổi sáng yên bình bên Hồ Gươm ✨",
    likes: 24,
    badges: 3,
    color: "bg-primary",
    image: hoGuomImg,
  },
  {
    id: 2,
    user: "Thanh Tùng",
    avatar: "TT",
    location: "Văn Miếu - Quốc Tử Giám",
    time: "32 phút trước",
    caption: "Hoàn thành nhiệm vụ tâm linh! 🏛️",
    likes: 18,
    badges: 5,
    color: "bg-accent",
    image: vanMieuImg,
  },
  {
    id: 3,
    user: "Hà My",
    avatar: "HM",
    location: "Chùa Trấn Quốc",
    time: "1 giờ trước",
    caption: "Golden hour tại chùa cổ nhất Hà Nội 🌅",
    likes: 45,
    badges: 2,
    color: "bg-xp",
  },
];

const FeedScreen = () => {
  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Jourstic Feed</h1>
        <p className="text-sm text-muted-foreground mb-6">Khám phá từ bạn bè của bạn</p>
      </motion.div>

      <div className="space-y-4">
        {feedItems.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
          >
            {/* User header */}
            <div className="flex items-center gap-3 p-4 pb-2">
              <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center`}>
                <span className="text-primary-foreground text-xs font-bold">{item.avatar}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{item.user}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{item.location}</span>
                  <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{item.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
                <Award className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-semibold text-primary">Verified</span>
              </div>
            </div>

            {/* Image */}
            {item.image ? (
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img src={item.image} alt={item.caption} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-full aspect-[4/3] ${item.color}/10 flex items-center justify-center`}>
                <div className="text-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground/50">Ảnh check-in nguyên bản</p>
                </div>
              </div>
            )}

            {/* Caption & actions */}
            <div className="p-4 pt-3">
              <p className="text-sm text-foreground mb-3">{item.caption}</p>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">{item.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <Award className="w-4 h-4" />
                  <span className="text-xs">{item.badges} huy chương</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs">Bình luận</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeedScreen;
