import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Navigation, MapPin, Lock, Star } from "lucide-react";
import mapBg from "@/assets/map-bg.jpg";

const checkpoints = [
  { id: 1, name: "Văn Miếu", x: 30, y: 40, unlocked: true, hot: true },
  { id: 2, name: "Hồ Hoàn Kiếm", x: 55, y: 55, unlocked: true, hot: false },
  { id: 3, name: "Chùa Trấn Quốc", x: 25, y: 25, unlocked: true, hot: false },
  { id: 4, name: "Phố Cổ", x: 60, y: 35, unlocked: false, hot: false },
  { id: 5, name: "Tây Hồ", x: 35, y: 15, unlocked: false, hot: false },
  { id: 6, name: "Lăng Bác", x: 18, y: 50, unlocked: false, hot: false },
];

const MapScreen = () => {
  const [selectedPin, setSelectedPin] = useState<number | null>(null);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Map background */}
      <img src={mapBg} alt="Map" className="absolute inset-0 w-full h-full object-cover" />

      {/* Fog overlay for locked areas */}
      {checkpoints.filter(cp => !cp.unlocked).map((cp) => (
        <div
          key={`fog-${cp.id}`}
          className="absolute pointer-events-none z-[5]"
          style={{
            left: `${cp.x}%`,
            top: `${cp.y}%`,
            transform: 'translate(-50%, -50%)',
            width: '140px',
            height: '140px',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle, hsla(210,15%,92%,0.75) 0%, hsla(210,15%,90%,0.6) 30%, hsla(210,15%,88%,0.4) 55%, transparent 80%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
        </div>
      ))}

      {/* Search bar */}
      <div className="absolute top-12 left-4 right-4 z-10">
        <div className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Tìm kiếm địa điểm...</span>
        </div>
      </div>

      {/* Map pins */}
      {checkpoints.map((cp) => (
        <motion.button
          key={cp.id}
          className="absolute z-10"
          style={{ left: `${cp.x}%`, top: `${cp.y}%` }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSelectedPin(selectedPin === cp.id ? null : cp.id)}
        >
          <div className={`relative flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all ${
            cp.unlocked
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          } ${cp.hot ? "animate-pulse-glow" : ""}`}>
            {cp.unlocked ? (
              <MapPin className="w-5 h-5" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {cp.hot && (
              <Star className="absolute -top-1 -right-1 w-4 h-4 text-xp fill-xp" />
            )}
          </div>
          {selectedPin === cp.id && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 glass-surface rounded-xl px-3 py-2 shadow-xl min-w-[120px]"
            >
              <p className="text-xs font-semibold text-foreground whitespace-nowrap">{cp.name}</p>
              {cp.unlocked ? (
                <p className="text-[10px] text-primary font-medium">Sẵn sàng khám phá</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">Hoàn thành nhiệm vụ để mở</p>
              )}
            </motion.div>
          )}
        </motion.button>
      ))}

      {/* Current location button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        className="absolute bottom-24 right-4 z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
      >
        <Navigation className="w-5 h-5" />
      </motion.button>

      {/* Fog of War label */}
      <div className="absolute top-28 left-4 z-10">
        <div className="glass-surface rounded-xl px-3 py-2 shadow-md">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Fog of War</p>
          <p className="text-xs text-muted-foreground">3/6 khu vực đã mở khóa</p>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
