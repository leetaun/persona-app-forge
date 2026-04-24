
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

  // Hàm này giờ sẽ đi tìm trong "sổ tay" offline thay vì hỏi Supabase
  const refresh = useCallback(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Lấy điểm XP từ localStorage (Mặc định là 0 nếu chưa có)
    const offlineXp = parseInt(localStorage.getItem('jourstic_xp') || '0', 10);

    // Tính level cơ bản (ví dụ cứ 100 XP lên 1 cấp)
    const calculatedLevel = Math.floor(offlineXp / 100) + 1;

    // Tạo một Profile ảo để nuôi giao diện
    const dummyProfile: Profile = {
      id: user.id,
      user_id: user.id,
      display_name: "Nhà Thám Hiểm", // Tên mặc định nếu chạy offline
      avatar_url: null,
      bio: "Đang khám phá Jourstic",
      xp: offlineXp,
      level: calculatedLevel,
    };

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
