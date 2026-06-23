import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, Trash2, Star, Send, MoreHorizontal, Award, Music, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const parseCaption = (raw: string | null): { rating: number; text: string } => {
  if (!raw) return { rating: 0, text: "" };
  const m = raw.match(/^\[★(\d)\]\s*/);
  if (m) return { rating: parseInt(m[1], 10), text: raw.slice(m[0].length) };
  return { rating: 0, text: raw };
};

interface PostMusic {
  id?: string;
  name: string;
  artists: string;
  preview_url: string | null;
  cover: string | null;
  external_url?: string | null;
}

interface FeedPost {
  id: string;
  user_id: string;
  caption: string | null;
  photo_url: string;
  location_name: string | null;
  created_at: string;
  media_type: "image" | "video";
  display_name: string | null;
  avatar_url: string | null;
  reaction_count: number;
  user_reacted: boolean;
  like_count: number;
  user_liked: boolean;
  music: PostMusic | null;
}

const QUICK_EMOJIS = ["❤️", "🔥", "😂", "😮", "😍", "👏"];

const AutoVideo = ({ src }: { src: string }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.6) el.play().catch(() => {});
          else el.pause();
        });
      },
      { threshold: [0, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      loop
      playsInline
      preload="metadata"
      className="w-full h-full object-cover"
    />
  );
};

const FeedScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [flyingEmoji, setFlyingEmoji] = useState<{ id: string; emoji: string } | null>(null);
  const [messageDraft, setMessageDraft] = useState<Record<string, string>>({});
  const [playingPostId, setPlayingPostId] = useState<string | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = (post: FeedPost) => {
    if (!post.music?.preview_url) return;
    if (playingPostId === post.id && musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
      setPlayingPostId(null);
      return;
    }
    if (musicAudioRef.current) musicAudioRef.current.pause();
    const audio = new Audio(post.music.preview_url);
    audio.volume = 0.9;
    audio.onended = () => { setPlayingPostId(null); musicAudioRef.current = null; };
    audio.play().catch(() => {});
    musicAudioRef.current = audio;
    setPlayingPostId(post.id);
  };

  useEffect(() => () => { musicAudioRef.current?.pause(); }, []);


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
      supabase.from("reactions").select("post_id,user_id,medal").in("post_id", postIds),
    ]);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const reactionMap = new Map<string, { count: number; mine: boolean }>();
    const likeMap = new Map<string, { count: number; mine: boolean }>();
    (reactions || []).forEach((r) => {
      const target = r.medal === "like" ? likeMap : reactionMap;
      const cur = target.get(r.post_id) || { count: 0, mine: false };
      cur.count++;
      if (r.user_id === user?.id) cur.mine = true;
      target.set(r.post_id, cur);
    });
    setPosts(
      rawPosts.map((p) => {
        const prof = profileMap.get(p.user_id);
        const rx = reactionMap.get(p.id) || { count: 0, mine: false };
        const lk = likeMap.get(p.id) || { count: 0, mine: false };
        const fallbackName = p.user_id === user?.id ? (user?.email?.split("@")[0] ?? "Bạn") : "Người dùng";
        return {
          ...p,
          media_type: ((p as any).media_type === "video" ? "video" : "image") as "image" | "video",
          display_name: prof?.display_name ?? fallbackName,
          avatar_url: prof?.avatar_url ?? null,
          reaction_count: rx.count,
          user_reacted: rx.mine,
          like_count: lk.count,
          user_liked: lk.mine,
          music: ((p as any).music && typeof (p as any).music === "object") ? (p as any).music as PostMusic : null,
        } as FeedPost;
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

  const toggleLike = async (post: FeedPost) => {
    if (!user) return;
    const wasLiked = post.user_liked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, user_liked: !wasLiked, like_count: Math.max(0, p.like_count + (wasLiked ? -1 : 1)) }
          : p
      )
    );
    const { error } = wasLiked
      ? await supabase.from("reactions").delete().match({ post_id: post.id, user_id: user.id, medal: "like" })
      : await supabase.from("reactions").insert({ post_id: post.id, user_id: user.id, medal: "like" });
    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, user_liked: wasLiked, like_count: Math.max(0, p.like_count + (wasLiked ? 1 : -1)) }
            : p
        )
      );
      toast({ title: "Không cập nhật được tim", description: error.message, variant: "destructive" });
    }
  };

  const sendEmoji = (post: FeedPost, emoji: string) => {
    setFlyingEmoji({ id: post.id, emoji });
    setTimeout(() => setFlyingEmoji(null), 1200);
    if (emoji === "❤️" && !post.user_liked) toggleLike(post);
    toast({ title: `Đã gửi ${emoji}`, description: `Tới ${post.display_name}` });
  };

  const sendMessage = (post: FeedPost) => {
    const text = (messageDraft[post.id] || "").trim();
    if (!text) return;
    setMessageDraft((d) => ({ ...d, [post.id]: "" }));
    toast({ title: "💬 Đã gửi tin nhắn", description: `Tới ${post.display_name}: ${text}` });
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-12 pb-3 px-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
          <span className="text-lg">👥</span>
        </button>
        <h1 className="text-base font-bold tracking-tight">Bảng tin</h1>
        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center">
          <span className="text-lg">💬</span>
        </button>
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
          <MapPin className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-white/70">Chưa có check-in nào. Hãy là người đầu tiên!</p>
        </div>
      ) : (
        <div
          className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`
            .feed-scroll::-webkit-scrollbar { display: none; }
            @keyframes floatUp { 0%{transform:translate(-50%,0) scale(1);opacity:1} 100%{transform:translate(-50%,-180px) scale(2);opacity:0} }
          `}</style>
          {posts.map((item) => {
            const { rating, text } = parseCaption(item.caption);
            return (
              <section
                key={item.id}
                className="h-screen w-full snap-start flex flex-col items-center justify-center px-5 relative"
              >
                {/* Header */}
                <div className="w-full max-w-md flex items-center justify-center gap-2 mb-4 mt-20">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">
                        {(item.display_name || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold">{item.display_name}</span>
                  <span className="text-xs text-white/50">·</span>
                  <span className="text-xs text-white/50">
                    {format(new Date(item.created_at), "HH:mm")} · {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: vi })}
                  </span>
                  {user?.id === item.user_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-1 w-7 h-7 flex items-center justify-center text-white/60">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-red-400 focus:text-red-400 focus:bg-white/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Gỡ bài viết
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Gỡ bài viết này?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bài viết sẽ bị xoá vĩnh viễn. Hành động này không thể hoàn tác.
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Photo card */}
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative w-full max-w-md aspect-square rounded-[44px] overflow-hidden bg-zinc-900 shadow-2xl"
                  onDoubleClick={() => sendEmoji(item, "❤️")}
                >
                  {item.media_type === "video" ? (
                    <AutoVideo src={item.photo_url} />
                  ) : (
                    <img src={item.photo_url} alt={text} className="w-full h-full object-cover" />
                  )}

                  {/* Caption overlay */}
                  {(text || rating > 0 || item.location_name) && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-4 max-w-[88%] px-4 py-2 rounded-full bg-black/55 backdrop-blur-md text-center">
                      {rating > 0 && (
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={`w-3 h-3 ${
                                n <= rating ? "fill-yellow-400 text-yellow-400" : "text-white/30"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      {text && <p className="text-sm font-medium leading-tight">{text}</p>}
                      {item.location_name && (
                        <p className="text-[11px] text-white/70 flex items-center justify-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {item.location_name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Flying emoji */}
                  <AnimatePresence>
                    {flyingEmoji?.id === item.id && (
                      <div
                        className="pointer-events-none absolute left-1/2 bottom-20 text-5xl"
                        style={{ animation: "floatUp 1.1s ease-out forwards" }}
                      >
                        {flyingEmoji.emoji}
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Music card */}
                {item.music && (
                  <div className="w-full max-w-md mt-3 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3 py-2">
                    {item.music.cover ? (
                      <img src={item.music.cover} alt="" className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-white/15 flex items-center justify-center flex-shrink-0"><Music className="w-4 h-4 text-white" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.music.name}</p>
                      <p className="text-[11px] text-white/60 truncate">{item.music.artists}</p>
                    </div>
                    {item.music.preview_url ? (
                      <button onClick={() => toggleMusic(item)} className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center flex-shrink-0">
                        {playingPostId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                    ) : item.music.external_url ? (
                      <a href={item.music.external_url} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-white/80 px-2 py-1 rounded-full bg-white/10 flex-shrink-0">Spotify</a>
                    ) : null}
                  </div>
                )}

                {/* Counts row */}
                <div className="w-full max-w-md flex items-center justify-center gap-5 mt-4">
                  <button
                    onClick={() => toggleLike(item)}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <Heart
                      className={`w-5 h-5 ${item.user_liked ? "fill-red-500 text-red-500" : "text-white/70"}`}
                    />
                    <span className="text-white/70">{item.like_count}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-white/70">
                    <Award className="w-5 h-5" />
                    <span>{item.reaction_count}</span>
                  </div>
                </div>

                {/* Bottom message bar */}
                <div className="absolute left-0 right-0 bottom-24 px-5">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-2 py-2 border border-white/15">
                      <input
                        value={messageDraft[item.id] || ""}
                        onChange={(e) => setMessageDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage(item)}
                        placeholder={`Gửi tin nhắn tới ${item.display_name}...`}
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50 px-3"
                      />
                      {messageDraft[item.id]?.trim() ? (
                        <button
                          onClick={() => sendMessage(item)}
                          className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 pr-1">
                          {QUICK_EMOJIS.slice(0, 4).map((e) => (
                            <button
                              key={e}
                              onClick={() => sendEmoji(item, e)}
                              className="text-xl active:scale-125 transition-transform"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeedScreen;
