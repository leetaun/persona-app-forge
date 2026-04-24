
import { supabase } from "@/integrations/supabase/client";


import { useEffect, useState, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  xp: number;
  level: number;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const offlineXp = parseInt(localStorage.getItem('jourstic_xp') || '0', 10);
    const calculatedLevel = Math.floor(offlineXp / 100) + 1;

    // --- SỬA ĐOẠN NÀY ---
    // Lấy tên từ metadata của Google hoặc cắt từ email ra
    const realName = user.user_metadata?.full_name || 
                     user.user_metadata?.display_name || 
                     user.email?.split('@')[0] || 
                     "Nhà Thám Hiểm";

    const dummyProfile: Profile = {
      id: user.id,
      user_id: user.id,
      display_name: realName, // Dùng tên thật ở đây
      avatar_url: user.user_metadata?.avatar_url || null, // Lấy luôn ảnh đại diện Google
      bio: "Đang khám phá Jourstic",
      xp: offlineXp,
      level: calculatedLevel,
    };
    // --------------------

    setProfile(dummyProfile);
    setLoading(false);
  }, [user]);

  // Chạy refresh lần đầu khi load app
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Hàm giúp UI cập nhật ngay lập tức khi được cộng điểm
  const addXpOptimistic = useCallback((delta: number) => {
    setProfile((p) => {
      if (!p) return p;
      const newXp = p.xp + delta;
      
      // Nhớ lưu luôn vào sổ tay offline để đồng bộ
      localStorage.setItem('jourstic_xp', newXp.toString());
      
      return { ...p, xp: newXp };
    });
  }, []);

  return { profile, loading, refresh, addXpOptimistic };
};
