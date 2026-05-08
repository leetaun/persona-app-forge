import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Verify = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // Sign out so the user lands on the login screen
      await supabase.auth.signOut();
      if (cancelled) return;
      toast.success("Xác minh thành công, vui lòng đăng nhập");
      navigate("/auth", { replace: true });
    };

    // Supabase parses the hash tokens and fires SIGNED_IN automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        finish();
      }
    });

    // Fallback: if no auth event arrives within 1.5s, still send them to login
    const timer = setTimeout(() => finish(), 1500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default Verify;
