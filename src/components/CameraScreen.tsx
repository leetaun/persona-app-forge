import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Loader2, Image as ImageIcon, X, Star, ArrowLeft, Send, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { getCheckpointXp } from "@/lib/xp";
import jsQR from "jsqr";

interface Checkpoint {
  id: string;
  name: string;
  area: string | null;
  lat: number;
  lng: number;
  xp_reward: number;
  qr_code?: string;
}

const SMART_TAGS: Record<string, string[]> = {
  "Văn hóa - Tâm linh": ["Kiến trúc đẹp cổ kính", "Trang nghiêm", "Chụp ảnh đẹp", "Cảnh sắc yên bình"],
  "Ẩm thực": ["Đồ ăn ngon", "Nước uống ngon", "Phục vụ tốt", "Decor đẹp"],
  "Nghệ thuật": ["Khuôn viên sạch sẽ", "Đậm chất nghệ thuật", "Độc đáo", "Chụp ảnh đẹp", "Mới mẻ"],
  "Nghỉ ngơi": ["Sạch sẽ", "Dịch vụ tốt", "Phục vụ chu đáo"],
};

// Danh sách các cột mốc để dò mã QR
const MY_PILLARS = [
  { id: "49_THANHNIEN_21045507_105836586", name: "49 Thanh Niên", qr_code: "49_THANHNIEN_21045507_105836586" },
  { id: "QUANGBA_21065935_105819695", name: "Quảng Bá", qr_code: "QUANGBA_21065935_105819695" },
  { id: "69_TONGOCVAN_21066414_105819176", name: "69 Tô Ngọc Vân", qr_code: "69_TONGOCVAN_21066414_105819176" },
  { id: "3_QUANGBA_21070314_105822777", name: "Ngõ 3 Quảng Bá", qr_code: "3_QUANGBA_21070314_105822777" },
  { id: "NGA_3_NHATCHIEU_21074211_105819733", name: "Ngã 3 Nhật Chiêu", qr_code: "NGA_3_NHATCHIEU_21074211_105819733" },
  { id: "VEHO_21069166_105812065", name: "Vệ Hồ", qr_code: "VEHO_21069166_105812065" },
  { id: "COT_CO_HA_NOI", name: "Cột cờ Hà Nội", qr_code: "COT_CO_HA_NOI" },
  { id: "DUONG_DOC_LAP", name: "Đường Độc Lập", qr_code: "DUONG_DOC_LAP" },
  { id: "DUONG_PHAN_DINH_PHUNG", name: "Đường Phan Đình Phùng", qr_code: "DUONG_PHAN_DINH_PHUNG" },
  { id: "KAMON_CAFE", name: "Kamon Cafe", qr_code: "KAMON_CAFE" }
];

type Step = "camera" | "preview" | "form";

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
  
  // Trạng thái cho Nút gạt & Quét QR
  const [mode, setMode] = useState<"photo" | "qr">("photo");
  const [isScanning, setIsScanning] = useState(false);
  const requestRef = useRef<number>();

  useEffect(() => {
    supabase.from("checkpoints").select("*").order("area").order("name")
      .then(({ data }) => setCheckpoints((data as Checkpoint[]) || []));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: true }
      );
    }
  }, []);

  const startCamera = async () => {
    try {
      // FIX 1: Ép độ phân giải HD để camera đọc mã QR nhạy hơn
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        await videoRef.current.play(); 
      }
      setCameraReady(true);
    } catch (err) {
      console.error(err);
      toast({ title: "Lỗi Camera", description: "Vui lòng cấp quyền camera trong cài đặt trình duyệt.", variant: "destructive" });
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
  }, [step]);

  // ===== LOGIC CHỐNG SPAM & TÍNH +10 XP KHI QUÉT ĐÚNG MÃ =====
  const handleQRSuccess = async (qrData: string) => {
    if (!user || isScanning) return;
    setIsScanning(true); 
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    try {
      // FIX 2: Cắt bỏ khoảng trắng thừa ở đầu/cuối của mã QR (đề phòng tạo mã lỗi)
      const cleanData = qrData.trim();
      const cp = MY_PILLARS.find(p => p.qr_code === cleanData);
      
      if (!cp) {
        // FIX 3: In hẳn dòng chữ quét được ra để bắt bệnh
        toast({ 
          title: "Mã QR không khớp!", 
          description: `Máy quét được chữ: "${cleanData}". Hãy tạo lại mã QR với đúng chuỗi văn bản này.`, 
          variant: "destructive",
          duration: 5000
        });
        setTimeout(() => setIsScanning(false), 3000);
        return;
      }

      // Chống Spam: Check xem người dùng đã mở khóa cột này chưa
      const { data: existing } = await supabase.from("check_ins").select("id").match({ user_id: user.id, checkpoint_id: cp.id }).maybeSingle();
      if (existing) {
        toast({ title: "Đã mở khóa", description: `Bạn đã khám phá ${cp.name} trước đó rồi, không được cộng thêm điểm!` });
        setTimeout(() => { window.location.href = "/"; }, 1500); 
        return;
      }

      // Lưu vào Database & +10 XP
      const { error: ciErr } = await supabase.from("check_ins").insert({
        user_id: user.id, 
        checkpoint_id: cp.id, 
        photo_url: "QR_UNLOCKED", 
        lat: coords?.lat ?? null, 
        lng: coords?.lng ?? null, 
        xp_earned: 10,
      });
      if (ciErr) throw ciErr;

      const { data: prof } = await supabase.from("profiles").select("xp").eq("user_id", user.id).single();
      await supabase.from("profiles").update({ xp: (prof?.xp || 0) + 10 }).eq("user_id", user.id);
      await refreshProfile();

      // Báo thành công và đá về Map
      toast({ title: `🎉 Chúc mừng! +10 XP`, description: `Bạn đã mở khóa thành công trạm ${cp.name}.` });
      setTimeout(() => { window.location.href = "/"; }, 2000);

    } catch (err: any) {
      console.error(err);
      toast({ title: "Lỗi kết nối", description: "Không thể xử lý lúc này.", variant: "destructive" });
      setIsScanning(false);
    }
  };

  const scanQRCode = () => {
    if (mode !== "qr" || !videoRef.current || !cameraReady || isScanning) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // FIX 4: Chuyển sang attemptBoth để quét các mã mờ, khó đọc
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        if (code && code.data) {
          handleQRSuccess(code.data);
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanQRCode);
  };

  useEffect(() => {
    if (mode === "qr" && cameraReady && !isScanning) { requestRef.current = requestAnimationFrame(scanQRCode); }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [mode, cameraReady, isScanning]);

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
        if (blob) { setPhotoBlob(blob); setPhotoPreview(URL.createObjectURL(blob)); setStep("preview"); }
      }, "image/jpeg", 0.9);
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBlob(file); setPhotoPreview(URL.createObjectURL(file)); setStep("preview");
  };

  const resetAll = () => { setPhotoBlob(null); setPhotoPreview(null); setCaption(""); setRating(0); setSelected(null); setStep("camera"); };

  const submitCheckin = async () => {
    if (!user || !photoBlob || !selected) return;
    setSubmitting(true);
    try {
      const path = `${user.id}/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("checkin-photos").upload(path, photoBlob, { contentType: "image/jpeg" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("checkin-photos").getPublicUrl(path);
      const earnedXp = getCheckpointXp(selected);
      const { data: checkIn, error: ciErr } = await supabase.from("check_ins").insert({
          user_id: user.id, checkpoint_id: selected.id, photo_url: pub.publicUrl, lat: coords?.lat ?? null, lng: coords?.lng ?? null, xp_earned: earnedXp,
        }).select().single();
      if (ciErr) throw ciErr;
      const fullCaption = [rating > 0 ? `[★${rating}]` : "", caption.trim()].filter(Boolean).join(" ");
      await supabase.from("posts").insert({ user_id: user.id, check_in_id: checkIn.id, photo_url: pub.publicUrl, caption: fullCaption || null, location_name: selected.name });
      const { data: prof } = await supabase.from("profiles").select("xp").eq("user_id", user.id).maybeSingle();
      await supabase.from("profiles").update({ xp: (prof?.xp ?? 0) + earnedXp }).eq("user_id", user.id);
      await refreshProfile();
      toast({ title: `+${earnedXp} XP! 🎉`, description: `Check-in tại ${selected.name} thành công.` });
      window.location.href = "/"; 
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const grouped = checkpoints.reduce<Record<string, Checkpoint[]>>((acc, c) => { const k = c.area || "Khác"; (acc[k] ||= []).push(c); return acc; }, {});
  const tags = selected?.area ? SMART_TAGS[selected.area] ?? [] : [];
  const addTag = (tag: string) => { setCaption((prev) => { if (!prev.trim()) return tag; if (prev.toLowerCase().includes(tag.toLowerCase())) return prev; return `${prev.trim()}, ${tag.toLowerCase()}`; }); };

  if (step === "camera") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        {/* Nút gạt chế độ */}
        <div className="absolute top-12 left-0 right-0 z-30 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-1 flex gap-1 border border-white/20">
            <button onClick={() => setMode("photo")} className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${mode === "photo" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/70 hover:text-white"}`}>
              <Camera className="w-4 h-4" /> Check-in
            </button>
            <button onClick={() => setMode("qr")} className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${mode === "qr" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/70 hover:text-white"}`}>
              <QrCode className="w-4 h-4" /> Quét Cột
            </button>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          {!cameraReady && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
        </div>

        {/* Khung ngắm Quét QR */}
        {mode === "qr" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/50">
            <div className="w-64 h-64 border-2 border-primary/50 relative bg-transparent overflow-hidden rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
               <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
               <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_red] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
            <p className="mt-8 text-white font-semibold bg-black/80 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 text-sm">
              {isScanning ? "Đang xử lý..." : "Đưa mã QR vào khung để nhận +10 XP"}
            </p>
            <style>{`@keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }`}</style>
          </div>
        )}

        {/* Nút chụp ảnh */}
        {mode === "photo" && (
          <div className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
            <div className="flex items-center gap-6">
              <label className="w-12 h-12 rounded-full bg-card/90 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-card">
                <ImageIcon className="w-5 h-5 text-foreground" /><input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
              </label>
              <button onClick={capture} disabled={!cameraReady} className="w-20 h-20 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-95 transition disabled:opacity-50">
                <div className="w-full h-full rounded-full border-2 border-primary/40" />
              </button>
              <div className="w-12 h-12" />
            </div>
            <p className="text-white/80 text-xs font-medium">Chụp ảnh để đăng Bảng tin</p>
          </div>
        )}
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">{photoPreview && <img src={photoPreview} alt="preview" className="w-full h-full object-contain" />}</div>
        <div className="absolute top-12 left-4 right-4 z-10 flex justify-between"><button onClick={resetAll} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"><X className="w-5 h-5" /></button></div>
        <div className="absolute bottom-28 left-4 right-4 z-10 flex gap-3"><button onClick={resetAll} className="flex-1 bg-card/90 backdrop-blur text-foreground rounded-2xl py-3.5 font-semibold">Chụp lại</button><button onClick={() => setStep("form")} className="flex-[2] bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg">Tiếp tục <Send className="w-4 h-4" /></button></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-12 pb-3 flex items-center gap-3"><button onClick={() => setStep("preview")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button><h1 className="text-lg font-bold text-foreground">Đánh giá check-in</h1></div>
      <div className="px-4 pt-4 space-y-5">
        {photoPreview && <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted"><img src={photoPreview} alt="" className="w-full h-full object-cover" /></div>}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Địa điểm</label>
          <select value={selected?.id ?? ""} onChange={(e) => { setSelected(checkpoints.find((c) => c.id === e.target.value) ?? null); setCaption(""); }} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground">
            <option value="">📍 Chọn địa điểm...</option>
            {Object.entries(grouped).map(([area, list]) => (<optgroup key={area} label={area}>{list.map((c) => (<option key={c.id} value={c.id}>{c.name} (+{getCheckpointXp(c)} XP)</option>))}</optgroup>))}
          </select>
          {selected && <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5 text-primary" /><span>{selected.area}</span><span className="ml-auto bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">+{getCheckpointXp(selected)} XP</span></div>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Đánh giá</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (<button key={n} onClick={() => setRating(n === rating ? 0 : n)} className="active:scale-90 transition"><Star className={`w-9 h-9 ${n <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} /></button>))}
            {rating > 0 && <span className="ml-2 text-sm font-semibold text-foreground">{rating}/5</span>}
          </div>
        </div>
        {tags.length > 0 && (
          <div><label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Gợi ý</label><div className="flex flex-wrap gap-2"><AnimatePresence>{tags.map((tag) => (<motion.button key={tag} onClick={() => addTag(tag)} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full hover:bg-primary/20 transition">+ {tag}</motion.button>))}</AnimatePresence></div></div>
        )}
        <div><label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Nhận xét</label><textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Chia sẻ trải nghiệm..." rows={3} className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground resize-none" /></div>
        <button onClick={submitCheckin} disabled={!selected || submitting} className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4" /> Đăng bài</>}</button>
      </div>
    </div>
  );
};

export default CameraScreen;
