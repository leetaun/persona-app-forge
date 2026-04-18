import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gem, Landmark, Sun, ChevronRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type PersonaId = "hidden_gems" | "spiritual" | "golden_hour";

const personas = [
  {
    id: "hidden_gems" as PersonaId,
    title: "Hidden Gems",
    subtitle: "Du lịch Bí ẩn",
    description: "Khám phá những địa điểm độc đáo chỉ người bản địa mới biết",
    icon: Gem,
    gradient: "from-emerald-500 to-teal-600",
    bgClass: "bg-secondary",
  },
  {
    id: "spiritual" as PersonaId,
    title: "Check-in Tâm linh",
    subtitle: "Văn hóa & Lịch sử",
    description: "Tập trung vào đền, chùa và các di tích lịch sử cổ",
    icon: Landmark,
    gradient: "from-amber-500 to-orange-600",
    bgClass: "bg-accent/10",
  },
  {
    id: "golden_hour" as PersonaId,
    title: "Săn ảnh Giờ vàng",
    subtitle: "Kiến trúc & Ánh sáng",
    description: "Gợi ý địa điểm có ánh sáng lý tưởng theo từng khung giờ",
    icon: Sun,
    gradient: "from-yellow-400 to-amber-500",
    bgClass: "bg-xp/5",
  },
];

interface PersonaScreenProps {
  onOpenHiddenGems?: () => void;
}

const PersonaScreen = ({ onOpenHiddenGems }: PersonaScreenProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<PersonaId>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_personas")
      .select("persona")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setSelected(new Set((data || []).map((d: any) => d.persona)));
      });
  }, [user]);

  const togglePersona = async (id: PersonaId) => {
    if (!user) return;
    if (selected.has(id)) {
      await supabase.from("user_personas").delete().match({ user_id: user.id, persona: id });
      setSelected((s) => {
        const ns = new Set(s);
        ns.delete(id);
        return ns;
      });
    } else {
      await supabase.from("user_personas").insert({ user_id: user.id, persona: id });
      setSelected((s) => new Set(s).add(id));
      toast({ title: "Đã chọn phong cách", description: "Lộ trình của bạn sẽ được cá nhân hoá." });
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Gợi ý Khám phá</h1>
        <p className="text-sm text-muted-foreground mb-6">Chọn phong cách hành trình (có thể nhiều)</p>
      </motion.div>

      <div className="space-y-4">
        {personas.map((p, i) => {
          const isSelected = selected.has(p.id);
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`w-full ${p.bgClass} rounded-2xl p-5 text-left border shadow-sm transition-all ${
                isSelected ? "border-primary ring-2 ring-primary/30" : "border-border/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} flex items-center justify-center flex-shrink-0`}
                >
                  <p.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">{p.title}</h3>
                      <p className="text-xs text-primary font-medium">{p.subtitle}</p>
                    </div>
                    <button
                      onClick={() => togglePersona(p.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">{p.description}</p>
                  {p.id === "hidden_gems" && (
                    <button
                      onClick={() => onOpenHiddenGems?.()}
                      className="mt-3 text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Xem danh sách <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 p-4 rounded-2xl border border-primary/20 bg-primary/5"
      >
        <p className="text-xs font-semibold text-primary mb-1">💡 Mẹo</p>
        <p className="text-xs text-muted-foreground">
          Mỗi phong cách sẽ mở ra các nhiệm vụ và địa điểm khác nhau trên bản đồ.
        </p>
      </motion.div>
    </div>
  );
};

export default PersonaScreen;
