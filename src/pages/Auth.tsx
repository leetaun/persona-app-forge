import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Đăng nhập thành công! 🎉" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast({
          title: "Đăng ký thành công! 🎉",
          description: "Kiểm tra email để xác nhận tài khoản nhé.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full max-w-lg mx-auto relative overflow-hidden bg-background flex flex-col items-center justify-center px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Khám Phá Việt Nam
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {isLogin ? "Đăng nhập để tiếp tục hành trình" : "Tạo tài khoản để bắt đầu khám phá"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-card border-border rounded-xl px-4"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Mật khẩu</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 bg-card border-border rounded-xl px-4 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl text-base font-semibold mt-2 shadow-lg"
          >
            {loading ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
          </Button>
        </form>

        {/* Toggle */}
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
