import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, MapPin, Clock, MessageCircle, Heart, Trash2, Star } from "lucide-react";

const parseCaption = (raw: string | null): { rating: number; text: string } => {
  if (!raw) return { rating: 0, text: "" };
  const m = raw.match(/^\[★(\d)\]\s*/);
  if (m) return { rating: parseInt(m[1], 10), text: raw.slice(m[0].length) };
  return { rating: 0, text: raw };
};
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
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
  like_count: number;
  user_liked: boolean;
}

const FeedScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXpOptimistic } = useProfile(); // THÊM DÒNG NÀY
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Dạy Feed đọc từ bộ nhớ tạm thay vì Supabase
  const loadPosts = () => {
    const offlinePosts = JSON.parse(localStorage.getItem('jourstic_posts') || '[]');
    setPosts(offlinePosts);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Sửa luôn hàm Xóa bài viết để nó không gọi mạng nữa
  const deletePost = (post: FeedPost) => {
    const existingPosts = JSON.parse(localStorage.getItem('jourstic_posts') || '[]');
    const updatedPosts = existingPosts.filter((p: any) => p.id !== post.id);
    localStorage.setItem('jourstic_posts', JSON.stringify(updatedPosts));
    setPosts(updatedPosts);
    toast({ title: "Đã gỡ bài viết" });
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

    const wasReacted = post.user_reacted;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              user_reacted: !wasReacted,
              reaction_count: Math.max(0, p.reaction_count + (wasReacted ? -1 : 1)),
            }
          : p
      )
    );

    const { error } = wasReacted
      ? await supabase
          .from("reactions")
          .delete()
          .match({ post_id: post.id, user_id: user.id, medal: "cheer" })
      : await supabase.from("reactions").insert({ post_id: post.id, user_id: user.id, medal: "cheer" });

    if (error) {
      // ... (giữ nguyên phần code báo lỗi của bạn) ...
      toast({
        title: "Không cập nhật được huy chương",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // ĐÃ SỬA CHỖ NÀY: Cộng 3 XP nếu tặng, trừ 3 XP nếu rút lại
      if (!wasReacted) {
        addXpOptimistic(3);
        toast({
          title: "🎉 Tặng huy chương thành công!",
          description: "Chúc mừng bạn được cộng +3 XP",
        });
      } else {
        addXpOptimistic(-3);
      }
    }
  };

  const toggleLike = async (post: FeedPost) => {
    if (!user) return;

    const wasLiked = post.user_liked;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              user_liked: !wasLiked,
              like_count: Math.max(0, p.like_count + (wasLiked ? -1 : 1)),
            }
          : p
      )
    );

    const { error } = wasLiked
      ? await supabase
          .from("reactions")
          .delete()
          .match({ post_id: post.id, user_id: user.id, medal: "like" })
      : await supabase.from("reactions").insert({ post_id: post.id, user_id: user.id, medal: "like" });

    if (error) {
      // ... (giữ nguyên phần code báo lỗi của bạn) ...
      toast({
        title: "Không cập nhật được lượt tim",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // ĐÃ SỬA CHỖ NÀY: Cộng 2 XP nếu thả tim, trừ 2 XP nếu bỏ tim
      if (!wasLiked) {
        addXpOptimistic(2);
        toast({
          title: "❤️ Đã thả tim!",
          description: "Chúc mừng bạn được cộng +2 XP",
        });
      } else {
        addXpOptimistic(-2);
      }
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
                {(() => {
                  const { rating, text } = parseCaption(item.caption);
                  return (
                    <>
                      {rating > 0 && (
                        <div className="flex items-center gap-0.5 mb-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-4 h-4 ${
                                n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs font-semibold text-foreground">{rating}.0</span>
                        </div>
                      )}
                      {text && <p className="text-sm text-foreground mb-3">{text}</p>}
                    </>
                  );
                })()}
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
                  <button
                    onClick={() => toggleLike(item)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      item.user_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    }`}
                    aria-label={item.user_liked ? "Bỏ thích" : "Thả tim"}
                  >
                    <Heart className={`w-4 h-4 ${item.user_liked ? "fill-red-500" : ""}`} />
                    <span className="text-xs">{item.like_count}</span>
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
