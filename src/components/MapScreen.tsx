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
      {checkpoints.filter(cp => !cp.unlocked).map((cp) => {
        const fogStyle = {
          background: 'radial-gradient(circle, hsla(210,15%,92%,0.7) 0%, hsla(210,15%,90%,0.5) 40%, transparent 70%)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        } as React.CSSProperties;
        // Multiple overlapping blobs to create cloud shape
        const blobs = [
          { dx: 0, dy: 0, w: 120, h: 90 },
          { dx: -40, dy: 15, w: 100, h: 80 },
          { dx: 45, dy: 10, w: 110, h: 75 },
          { dx: -20, dy: -25, w: 90, h: 70 },
          { dx: 30, dy: -20, w: 95, h: 65 },
          { dx: -55, dy: -5, w: 80, h: 60 },
          { dx: 60, dy: -10, w: 75, h: 60 },
        ];
        return blobs.map((blob, i) => (
          <div
            key={`fog-${cp.id}-${i}`}
            className="absolute pointer-events-none z-[5]"
            style={{
              left: `${cp.x}%`,
              top: `${cp.y}%`,
              transform: `translate(calc(-50% + ${blob.dx}px), calc(-50% + ${blob.dy}px))`,
              width: `${blob.w}px`,
              height: `${blob.h}px`,
              borderRadius: '50%',
              ...fogStyle,
            }}
          />
        ));
      })}

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

      {/* Current location blue dot */}
      <div
        className="absolute z-20"
        style={{ left: '30%', top: '46%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Pulsing ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[hsl(210,100%,56%)]/20"
          animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Blue dot with white border */}
        <div className="relative w-3.5 h-3.5 rounded-full bg-[hsl(210,100%,56%)] border-2 border-white shadow-md" />
      </div>

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
