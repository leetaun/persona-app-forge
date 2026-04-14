import { Map, Compass, Camera, Users, Trophy } from "lucide-react";

type Tab = "map" | "persona" | "camera" | "feed" | "achievements";

interface BottomNavProps {
  active: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: typeof Map; label: string }[] = [
  { id: "map", icon: Map, label: "Bản đồ" },
  { id: "persona", icon: Compass, label: "Khám phá" },
  { id: "camera", icon: Camera, label: "Camera" },
  { id: "feed", icon: Users, label: "Feed" },
  { id: "achievements", icon: Trophy, label: "Thành tựu" },
];

const BottomNav = ({ active, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-surface border-t border-border/30 pb-safe">
      <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          const isCamera = id === "camera";
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isCamera
                  ? "relative -mt-6"
                  : ""
              } ${isActive && !isCamera ? "text-primary" : "text-muted-foreground"}`}
            >
              {isCamera ? (
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isActive ? "bg-primary text-primary-foreground animate-pulse-glow" : "bg-primary/80 text-primary-foreground"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
              ) : (
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
              )}
              <span className={`text-[10px] font-medium ${isCamera ? "mt-1" : ""}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
