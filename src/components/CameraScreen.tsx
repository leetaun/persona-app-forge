import { motion } from "framer-motion";
import { QrCode, MapPin, Clock, CheckCircle2, Crosshair } from "lucide-react";

const CameraScreen = () => {
  return (
    <div className="h-full relative bg-foreground/95 flex flex-col items-center justify-center overflow-hidden">
      {/* Simulated camera viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-primary/60 rounded-3xl relative">
          {/* Corner marks */}
          <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
          <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
          <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
          <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />

          {/* Scanning line */}
          <motion.div
            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{ top: ["10%", "90%", "10%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Center crosshair */}
          <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/40" />
        </div>
      </div>

      {/* Top info bar */}
      <div className="absolute top-12 left-4 right-4 z-10">
        <div className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3">
          <QrCode className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs font-semibold text-foreground">Quét mã QR</p>
            <p className="text-[10px] text-muted-foreground">Hướng camera vào QR box để nhận nhiệm vụ</p>
          </div>
        </div>
      </div>

      {/* Bottom mission card */}
      <div className="absolute bottom-28 left-4 right-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-surface rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Nhiệm vụ: Văn Miếu</p>
              <p className="text-[10px] text-muted-foreground">Chụp ảnh cổng chính theo template AR</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1 text-primary">
              <CheckCircle2 className="w-3 h-3" /> GPS xác thực
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" /> 15:30
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-primary transition-all" />
          </div>
          <p className="text-[10px] text-muted-foreground">Bước 1/3: Di chuyển đến vị trí</p>
        </motion.div>
      </div>

      {/* AR Grid overlay hint */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-primary" style={{ top: `${(i + 1) * 14}%` }} />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-primary" style={{ left: `${(i + 1) * 20}%` }} />
        ))}
      </div>
    </div>
  );
};

export default CameraScreen;
