import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Loader2, Image as ImageIcon, X, Star, ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

interface Checkpoint {
  id: string;
  name: string;
  area: string | null;
  lat: number;
  lng: number;
  xp_reward: number;
  unlock_radius_m: number;
}

// Smart tag suggestions per area group
const SMART_TAGS: Record<string, string[]> = {
  "Văn hóa - Tâm linh": ["Kiến trúc đẹp cổ kính", "Trang nghiêm", "Chụp ảnh đẹp", "Cảnh sắc yên bình"],
  "Ẩm thực": ["Đồ ăn ngon", "Nước uống ngon", "Phục vụ tốt", "Decor đẹp"],
  "Nghệ thuật": ["Khuôn viên sạch sẽ", "Đậm chất nghệ thuật", "Độc đáo", "Chụp ảnh đẹp", "Mới mẻ"],
  "Nghỉ ngơi": ["Sạch sẽ", "Dịch vụ tốt", "Phục vụ chu đáo"],
};

type Step = "camera" | "preview" | "form";

// Dynamic XP per area group (source of truth, mirrors DB checkpoints.xp_reward)
const XP_BY_AREA: Record<string, number> = {
  "Văn hóa - Tâm linh": 150,
  "Nghệ thuật": 120,
  "Nghỉ ngơi": 80,
  "Ẩm thực": 50,
};
const getXpForCheckpoint = (c: Checkpoint | null) =>
  (c?.area && XP_BY_AREA[c.area]) ?? c?.xp_reward ?? 0;

const CameraScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { refresh: refreshProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<Step>("camera");

  useEffect(() => {
    supabase
      .from("checkpoints")
      .select("*")
      .order("area")
      .order("name")
      .then(({ data }) => setCheckpoints((data as Checkpoint[]) || []));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      toast({
        title: "Không truy cập được camera",
        description: "Vui lòng cấp quyền hoặc dùng tải ảnh thay thế.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => {
    if (step === "camera") startCamera();
    else stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setPhotoPreview(URL.createObjectURL(blob));
          setStep("preview");
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBlob(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep("preview");
  };

  const resetAll = () => {
    setPhotoBlob(null);
    setPhotoPreview(null);
    setCaption("");
    setRating(0);
    setSelected(null);
    setStep("camera");
  };

const submitCheckin = async () => {
  if (!user || !photoBlob || !selected) return;
  setSubmitting(true);

  try {
    const path = `${user.id}/${Date.now()}.jpg`;

    const { error: upErr } = await supabase.storage
      .from("checkin-photos")
      .upload(path, photoBlob, { contentType: "image/jpeg" });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("checkin-photos").getPublicUrl(path);
    const photo_url = pub.publicUrl;

    const earnedXp = getXpForCheckpoint(selected);

    const { data: checkIn, error: ciErr } = await supabase
      .from("check_ins")
      .insert({
        user_id: user.id,
        checkpoint_id: selected.id,
        photo_url,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        xp_earned: earnedXp,
      })
      .select()
      .single();

    if (ciErr) throw ciErr;

    const ratingMarker = rating > 0 ? `[★${rating}]` : "";
    const fullCaption = [ratingMarker, caption.trim()].filter(Boolean).join(" ");

    const { error: postErr } = await supabase.from("posts").insert({
      user_id: user.id,
      check_in_id: checkIn.id,
      photo_url,
      caption: fullCaption || null,
      location_name: selected.name,
    });

    if (postErr) throw postErr;

    const { data: prof, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, xp, display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profErr) throw profErr;

    const currentXp = prof?.xp ?? 0;

    const { data: savedProfile, error: xpErr } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          xp: currentXp + earnedXp,
          display_name: prof?.display_name ?? user.email?.split("@")[0] ?? "Explorer",
          avatar_url: prof?.avatar_url ?? null,
        },
        { onConflict: "user_id" }
      )
      .select()
      .maybeSingle();

    if (xpErr) throw xpErr;
    if (!savedProfile) throw new Error("Không lưu được XP vào profiles.");

    await refreshProfile();

    toast({
      title: `+${earnedXp} XP! 🎉`,
      description: `Check-in tại ${selected.name} đã được đăng thành công.`,
    });

    resetAll();
  } catch (err: any) {
    toast({
      title: "Lỗi",
      description: err.message,
      variant: "destructive",
    });
  } finally {
    setSubmitting(false);
  }
};

  // Group checkpoints by area for the select
  const grouped = checkpoints.reduce<Record<string, Checkpoint[]>>((acc, c) => {
    const k = c.area || "Khác";
    (acc[k] ||= []).push(c);
    return acc;
  }, {});

  const tags = selected?.area ? SMART_TAGS[selected.area] ?? [] : [];

  const addTag = (tag: string) => {
    setCaption((prev) => {
      if (!prev.trim()) return tag;
      if (prev.toLowerCase().includes(tag.toLowerCase())) return prev;
      return `${prev.trim()}, ${tag.toLowerCase()}`;
    });
  };

  // ===== CAMERA STEP =====
  if (step === "camera") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}

          {/* 3x3 alignment grid (pro camera style) */}
          {cameraReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
            </div>
          )}
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
          <div className="flex items-center gap-6">
            <label className="w-12 h-12 rounded-full bg-card/90 backdrop-blur flex items-center justify-center cursor-pointer">
              <ImageIcon className="w-5 h-5 text-foreground" />
              <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
            </label>
            <button
              onClick={capture}
              disabled={!cameraReady}
              className="w-20 h-20 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-95 transition disabled:opacity-50"
              aria-label="Chụp"
            >
              <div className="w-full h-full rounded-full border-2 border-primary/40" />
            </button>
            <div className="w-12 h-12" />
          </div>
          <p className="text-white/80 text-xs">Chụp ảnh để check-in</p>
        </div>
      </div>
    );
  }

  // ===== PREVIEW STEP =====
  if (step === "preview") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {photoPreview && (
            <img src={photoPreview} alt="preview" className="w-full h-full object-contain" />
          )}
        </div>
        {/* Top bar */}
        <div className="absolute top-12 left-4 right-4 z-10 flex justify-between">
          <button
            onClick={resetAll}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Bottom action */}
        <div className="absolute bottom-28 left-4 right-4 z-10 flex gap-3">
          <button
            onClick={resetAll}
            className="flex-1 bg-card/90 backdrop-blur text-foreground rounded-2xl py-3.5 font-semibold"
          >
            Chụp lại
          </button>
          <button
            onClick={() => setStep("form")}
            className="flex-[2] bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            Tiếp tục
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ===== FORM STEP =====
  return (
    <div className="h-full overflow-y-auto bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={() => setStep("preview")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Đánh giá check-in</h1>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Photo */}
        {photoPreview && (
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            <img src={photoPreview} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Location select */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
            Địa điểm
          </label>
          <select
            value={selected?.id ?? ""}
            onChange={(e) => {
              setSelected(checkpoints.find((c) => c.id === e.target.value) ?? null);
              setCaption("");
            }}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground"
          >
            <option value="">📍 Chọn địa điểm...</option>
            {Object.entries(grouped).map(([area, list]) => (
              <optgroup key={area} label={area}>
                {list.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (+{c.xp_reward} XP)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selected && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>{selected.area}</span>
              <span className="ml-auto bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                +{selected.xp_reward} XP
              </span>
            </div>
          )}
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
            Đánh giá của bạn
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n === rating ? 0 : n)}
                className="active:scale-90 transition"
                aria-label={`${n} sao`}
              >
                <Star
                  className={`w-9 h-9 ${
                    n <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-semibold text-foreground">{rating}/5</span>
            )}
          </div>
        </div>

        {/* Smart tags */}
        {tags.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
              Gợi ý nhận xét
            </label>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {tags.map((tag) => (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => addTag(tag)}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition"
                  >
                    + {tag}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Caption */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">
            Nhận xét
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn..."
            rows={3}
            className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={submitCheckin}
          disabled={!selected || submitting}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Đăng bài (+{selected ? getXpForCheckpoint(selected) : 0} XP)
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CameraScreen;
