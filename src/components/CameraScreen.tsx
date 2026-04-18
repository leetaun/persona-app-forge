import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, MapPin, CheckCircle2, Crosshair, X, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Checkpoint {
  id: string;
  name: string;
  area: string | null;
  lat: number;
  lng: number;
  xp_reward: number;
  unlock_radius_m: number;
}

const CameraScreen = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [caption, setCaption] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  // Load checkpoints
  useEffect(() => {
    supabase
      .from("checkpoints")
      .select("*")
      .order("name")
      .then(({ data }) => setCheckpoints((data as Checkpoint[]) || []));
  }, []);

  // Get GPS
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  // Start camera
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
    } catch (err) {
      toast({
        title: "Không truy cập được camera",
        description: "Vui lòng cấp quyền hoặc dùng tải ảnh thay thế.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const { data: checkIn, error: ciErr } = await supabase
        .from("check_ins")
        .insert({
          user_id: user.id,
          checkpoint_id: selected.id,
          photo_url,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          xp_earned: selected.xp_reward,
        })
        .select()
        .single();
      if (ciErr) throw ciErr;

      await supabase.from("posts").insert({
        user_id: user.id,
        check_in_id: checkIn.id,
        photo_url,
        caption: caption || null,
        location_name: selected.name,
      });

      toast({
        title: `+${selected.xp_reward} XP! 🎉`,
        description: `Check-in tại ${selected.name} đã được xác thực.`,
      });
      setPhotoBlob(null);
      setPhotoPreview(null);
      setCaption("");
      setSelected(null);
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const distanceToSelected = selected && coords
    ? haversine(coords.lat, coords.lng, selected.lat, selected.lng)
    : null;
  const inRange = distanceToSelected !== null && distanceToSelected <= (selected?.unlock_radius_m ?? 200);

  return (
    <div className="h-full relative bg-foreground/95 flex flex-col overflow-hidden">
      {/* Camera viewfinder */}
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
        {/* AR grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-white" style={{ top: `${(i + 1) * 16}%` }} />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-white" style={{ left: `${(i + 1) * 25}%` }} />
          ))}
        </div>
        {/* Frame */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-72 h-72 border-2 border-primary/70 rounded-3xl relative">
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-2xl" />
            <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary/40" />
          </div>
        </div>
      </div>

      {/* Top: select checkpoint */}
      <div className="absolute top-12 left-4 right-4 z-10">
        <select
          value={selected?.id ?? ""}
          onChange={(e) => setSelected(checkpoints.find((c) => c.id === e.target.value) ?? null)}
          className="w-full glass-surface rounded-2xl px-4 py-3 text-sm font-semibold text-foreground bg-card/95"
        >
          <option value="">📍 Chọn nhiệm vụ check-in...</option>
          {checkpoints.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (+{c.xp_reward} XP)
            </option>
          ))}
        </select>
        {selected && (
          <div className="mt-2 glass-surface rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="text-foreground font-medium flex-1 truncate">{selected.area}</span>
            {distanceToSelected !== null ? (
              <span className={inRange ? "text-primary font-semibold" : "text-muted-foreground"}>
                {distanceToSelected < 1000 ? `${Math.round(distanceToSelected)}m` : `${(distanceToSelected / 1000).toFixed(1)}km`}
                {inRange && <CheckCircle2 className="inline w-3 h-3 ml-1" />}
              </span>
            ) : (
              <span className="text-muted-foreground">📡 GPS...</span>
            )}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
        {!photoPreview ? (
          <>
            <div className="flex items-center gap-6">
              <label className="w-12 h-12 rounded-full bg-card/90 backdrop-blur flex items-center justify-center cursor-pointer">
                <ImageIcon className="w-5 h-5 text-foreground" />
                <input type="file" accept="image/*" capture="environment" onChange={onFileUpload} className="hidden" />
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
            <p className="text-white/80 text-xs">
              {selected ? "Chụp ảnh check-in" : "Chọn nhiệm vụ trước khi chụp"}
            </p>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full glass-surface rounded-2xl p-4 space-y-3"
          >
            <div className="flex gap-3">
              <img src={photoPreview} alt="preview" className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Caption (tuỳ chọn)..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground border-b border-border focus:outline-none focus:border-primary py-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {selected?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setPhotoBlob(null);
                  setPhotoPreview(null);
                }}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={submitCheckin}
              disabled={!selected || submitting}
              className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Check-in & Đăng feed (+{selected?.xp_reward ?? 0} XP)
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default CameraScreen;
