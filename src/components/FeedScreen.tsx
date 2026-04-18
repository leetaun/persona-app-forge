import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, MapPin, Clock, MessageCircle, Heart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FeedPost {
  id: string;
  user_id: string;
  caption: string | null;
  photo_url: string;
  location_name: string | null;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  reaction_count: number;
  user_reacted: boolean;
}

const FeedScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  const deletePost = async (post: FeedPost) => {
    if (!user || post.user_id !== user.id) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Không xoá được bài", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    toast({ title: "Đã gỡ bài viết" });
  };

  const loadPosts = async () => {
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rawPosts) {
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
    const postIds = rawPosts.map((p) => p.id);

    const [{ data: profiles }, { data: reactions }] = await Promise.all([
      supabase.from("profiles").select("user_id,display_name,avatar_url").in("user_id", userIds),
      supabase.from("reactions").select("post_id,user_id").in("post_id", postIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const reactionMap = new Map<string, { count: number; mine: boolean }>();
    (reactions || []).forEach((r) => {
      const cur = reactionMap.get(r.post_id) || { count: 0, mine: false };
      cur.count++;
      if (r.user_id === user?.id) cur.mine = true;
      reactionMap.set(r.post_id, cur);
    });

    setPosts(
      rawPosts.map((p) => {
        const prof = profileMap.get(p.user_id);
        const rx = reactionMap.get(p.id) || { count: 0, mine: false };
        return {
          ...p,
          display_name: prof?.display_name ?? "Khách",
          avatar_url: prof?.avatar_url ?? null,
          reaction_count: rx.count,
          user_reacted: rx.mine,
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    const ch = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, loadPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, loadPosts)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const toggleReaction = async (post: FeedPost) => {
    if (!user) return;
    if (post.user_reacted) {
      await supabase.from("reactions").delete().match({ post_id: post.id, user_id: user.id, medal: "cheer" });
    } else {
      await supabase.from("reactions").insert({ post_id: post.id, user_id: user.id, medal: "cheer" });
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pt-14 pb-28 bg-background">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Jourstic Feed</h1>
        <p className="text-sm text-muted-foreground mb-6">Khám phá từ cộng đồng</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chưa có check-in nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
              className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm"
            >
              <div className="flex items-center gap-3 p-4 pb-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-foreground text-xs font-bold">
                      {(item.display_name || "?").slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.display_name}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {item.location_name && (
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                        {item.location_name}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full flex-shrink-0">
                  <Award className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-semibold text-primary">Verified</span>
                </div>
                {user?.id === item.user_id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="w-8 h-8 rounded-full hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive flex-shrink-0 transition-colors"
                        aria-label="Gỡ bài"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Gỡ bài viết này?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bài viết sẽ bị xoá khỏi feed. Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Huỷ</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePost(item)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Gỡ bài
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
                <img src={item.photo_url} alt={item.caption ?? ""} className="w-full h-full object-cover" />
              </div>

              <div className="p-4 pt-3">
                {item.caption && <p className="text-sm text-foreground mb-3">{item.caption}</p>}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleReaction(item)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      item.user_reacted ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Award className={`w-4 h-4 ${item.user_reacted ? "fill-primary" : ""}`} />
                    <span className="text-xs">{item.reaction_count}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedScreen;
