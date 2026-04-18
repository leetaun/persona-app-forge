
-- ============ ENUMS ============
CREATE TYPE public.persona_type AS ENUM ('hidden_gems', 'spiritual', 'golden_hour');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============ HELPER: updated_at trigger ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ ROLES (separate table to avoid privilege escalation) ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ============ USER PERSONAS (multi) ============
CREATE TABLE public.user_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona persona_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, persona)
);
ALTER TABLE public.user_personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own personas" ON public.user_personas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own personas" ON public.user_personas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own personas" ON public.user_personas FOR DELETE USING (auth.uid() = user_id);

-- ============ CHECKPOINTS (POIs) ============
CREATE TABLE public.checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Hà Nội',
  area TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  qr_code TEXT UNIQUE,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  persona_tags persona_type[] DEFAULT '{}',
  is_hot BOOLEAN NOT NULL DEFAULT false,
  unlock_radius_m INTEGER NOT NULL DEFAULT 200,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Checkpoints public read" ON public.checkpoints FOR SELECT USING (true);
CREATE POLICY "Admins manage checkpoints" ON public.checkpoints FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ CHECK-INS ============
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES public.checkpoints(id) ON DELETE CASCADE,
  photo_url TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Check-ins public read" ON public.check_ins FOR SELECT USING (true);
CREATE POLICY "Users insert own check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own check-ins" ON public.check_ins FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_checkins_user ON public.check_ins(user_id);
CREATE INDEX idx_checkins_checkpoint ON public.check_ins(checkpoint_id);

-- Award XP after check-in
CREATE OR REPLACE FUNCTION public.award_checkin_xp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET xp = xp + NEW.xp_earned,
      level = GREATEST(1, ((xp + NEW.xp_earned) / 500) + 1)
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_checkin_award_xp AFTER INSERT ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.award_checkin_xp();

-- ============ POSTS (feed) ============
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE CASCADE,
  caption TEXT,
  photo_url TEXT NOT NULL,
  location_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts public read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_posts_created ON public.posts(created_at DESC);

-- ============ REACTIONS (medal cheers) ============
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medal TEXT NOT NULL DEFAULT 'cheer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id, medal)
);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions public read" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users insert own reactions" ON public.reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reactions" ON public.reactions FOR DELETE USING (auth.uid() = user_id);

-- ============ BADGES ============
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges public read" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges public read" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users insert own user_badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ VOUCHERS ============
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  partner TEXT,
  description TEXT,
  discount TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vouchers public read" ON public.vouchers FOR SELECT USING (true);
CREATE POLICY "Admins manage vouchers" ON public.vouchers FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  redeemed BOOLEAN NOT NULL DEFAULT false,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, voucher_id)
);
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own vouchers" ON public.user_vouchers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own vouchers" ON public.user_vouchers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own vouchers" ON public.user_vouchers FOR UPDATE USING (auth.uid() = user_id);

-- ============ STORAGE BUCKET for check-in photos ============
INSERT INTO storage.buckets (id, name, public) VALUES ('checkin-photos','checkin-photos', true);
CREATE POLICY "Checkin photos public read" ON storage.objects FOR SELECT USING (bucket_id = 'checkin-photos');
CREATE POLICY "Users upload own checkin photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own checkin photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'checkin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ REALTIME for posts/reactions ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- ============ SEED: Hà Nội checkpoints ============
INSERT INTO public.checkpoints (name, description, area, lat, lng, qr_code, xp_reward, persona_tags, is_hot, cover_image) VALUES
('Văn Miếu - Quốc Tử Giám','Trường đại học đầu tiên của Việt Nam','Đống Đa',21.0294,105.8354,'JST-VANMIEU',80,ARRAY['spiritual','hidden_gems']::persona_type[],true,null),
('Hồ Hoàn Kiếm','Trái tim của Hà Nội với Tháp Rùa huyền thoại','Hoàn Kiếm',21.0285,105.8524,'JST-HOANKIEM',60,ARRAY['golden_hour','spiritual']::persona_type[],false,null),
('Chùa Trấn Quốc','Ngôi chùa cổ nhất Hà Nội bên Hồ Tây','Tây Hồ',21.0480,105.8378,'JST-TRANQUOC',70,ARRAY['spiritual','golden_hour']::persona_type[],false,null),
('Phố Cổ Hà Nội','36 phố phường nhộn nhịp','Hoàn Kiếm',21.0341,105.8505,'JST-PHOCO',50,ARRAY['hidden_gems']::persona_type[],false,null),
('Hồ Tây','Hồ lớn nhất nội thành, hoàng hôn tuyệt đẹp','Tây Hồ',21.0587,105.8217,'JST-TAYHO',60,ARRAY['golden_hour']::persona_type[],false,null),
('Lăng Chủ tịch Hồ Chí Minh','Quảng trường Ba Đình lịch sử','Ba Đình',21.0368,105.8345,'JST-LANGBAC',90,ARRAY['spiritual']::persona_type[],false,null);

-- ============ SEED: badges ============
INSERT INTO public.badges (code, name, description, icon, rarity) VALUES
('first_step','Bước Chân Đầu Tiên','Hoàn thành check-in đầu tiên','🥾','common'),
('spiritual_5','Hành Trình Tâm Linh','5 check-in tại di tích tâm linh','🙏','rare'),
('golden_hour_3','Săn Giờ Vàng','3 ảnh tại giờ vàng','📸','rare'),
('hidden_gems_5','Thợ Săn Bí Ẩn','Khám phá 5 hidden gems','💎','epic'),
('hanoi_master','Bậc Thầy Hà Nội','Check-in toàn bộ Hà Nội','👑','legendary');

-- ============ SEED: vouchers ============
INSERT INTO public.vouchers (code, title, partner, description, discount, expires_at) VALUES
('CAFE10','Cafe Trứng Giảm 10%','Giảng Café','Áp dụng tại cơ sở phố cổ','-10%', now() + interval '60 days'),
('PHO20','Phở Bát Đàn -20K','Phở Bát Đàn','Giảm 20.000đ cho hoá đơn từ 100K','-20K', now() + interval '90 days'),
('TOUR15','Tour Xích Lô Phố Cổ -15%','Hanoi Cyclo','Tour 1h khám phá 36 phố phường','-15%', now() + interval '120 days');
