import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";
import { computeLevel, levelName } from "@/lib/levels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface LevelUpContextType {
  triggerCheck: () => void;
}

const LevelUpContext = createContext<LevelUpContextType>({ triggerCheck: () => {} });

export const useLevelUp = () => useContext(LevelUpContext);

export const LevelUpProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  const lastLevelRef = useRef<number | null>(null);
  const [newLevel, setNewLevel] = useState<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    const lvl = computeLevel(profile.xp);
    if (lastLevelRef.current === null) {
      lastLevelRef.current = lvl;
      return;
    }
    if (lvl > lastLevelRef.current) {
      setNewLevel(lvl);
    }
    lastLevelRef.current = lvl;
  }, [profile?.xp]);

  return (
    <LevelUpContext.Provider value={{ triggerCheck: () => {} }}>
      {children}
      <Dialog open={newLevel !== null} onOpenChange={(o) => !o && setNewLevel(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Lên cấp! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              Hành trình của bạn vừa bước sang một chương mới.
            </DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">
              Chúc mừng bạn đã đạt cấp độ {newLevel ? levelName(newLevel) : ""}!
            </p>
            <p className="text-xs text-muted-foreground">Level {newLevel}</p>
          </motion.div>
        </DialogContent>
      </Dialog>
    </LevelUpContext.Provider>
  );
};
