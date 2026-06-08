import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Loader2, Image as ImageIcon, X, Star, ArrowLeft, Send, QrCode, Navigation, List, Video, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
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
  { id: "KAMON_CAFE", name: "Kamon Cafe", qr_code: "KAMON_CAFE" },
];

const getCalculatedXp = (area: string | null) => {
  if (area === "Vị trí hiện tại") return 50;
  if (area === "Văn hóa - Tâm linh") return 100;
  if (area === "Nghệ thuật") return 80;
  if (area === "Nghỉ ngơi") return 50;
  if (area === "Trường học") return 30;
  if (area === "Ẩm thực") return 20;
  if (area === "Trạm thám hiểm") return 10;
  return 5;
};

type Step = "camera" | "preview" | "form";

const CameraScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh: refreshProfile } = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [selected, setSelected] = useState<Checkpoint | null>(null);
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(0);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState<Step>("camera");
  const [locationTab, setLocationTab] = useState<"current" | "list">("current");
  const [currentLocLabel, setCurrentLocLabel] = useState<string | null>(null);
  const [fetchingLoc, setFetchingLoc] = useState(false);

  // Video recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<number | null>(null);
  const recordTimeoutRef = useRef<number | null>(null);
  const recordStartRef = useRef<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const progressRafRef = useRef<number>();
  const MAX_RECORD_MS = 15000;
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

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

  const startCamera = async (nextFacing?: "environment" | "user") => {
    const mode = nextFacing ?? facingMode;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      streamRef.current = stream;
      // Mute audio tracks until recording starts (preview playback)
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        videoRef.current.muted = true;
        await videoRef.current.play(); 
      }
      setCameraReady(true);
    } catch (err) {
      console.error(err);
      // Fallback without audio (e.g., mic denied)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCameraReady(true);
      } catch {
        toast({ title: "Lỗi Camera", description: "Vui lòng cấp quyền camera.", variant: "destructive" });
      }
    }
  };

  const toggleCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    stopCamera();
    startCamera(next);
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

  const handleQRSuccess = async (qrData: string) => {
    if (!user || isScanning) return;
    setIsScanning(true); 
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    try {
      const cleanData = qrData.trim();
      const pillar = MY_PILLARS.find(p => p.qr_code === cleanData || p.id === cleanData);
      
      if (!pillar) {
        toast({ title: "Mã QR lạ", description: `Hệ thống không tìm thấy trạm.`, variant: "destructive" });
        setTimeout(() => setIsScanning(false), 3000);
        return;
      }

      const cp = checkpoints.find(c => c.name === pillar.name);
      if (!cp) {
        toast({ title: "Lỗi đồng bộ", description: `Chưa có ${pillar.name} trên Database!`, variant: "destructive" });
        setTimeout(() => setIsScanning(false), 3000);
        return;
      }

      const { data: existing } = await supabase.from("check_ins").select("id").match({ user_id: user.id, checkpoint_id: cp.id }).maybeSingle();

      if (existing) {
        toast({ title: "Đã mở khóa", description: `Bạn đã nhận điểm tại ${cp.name} rồi!` });
        setTimeout(() => { window.location.href = "/"; }, 2000); 
        return;
      }

      await supabase.from("check_ins").insert({
        user_id: user.id, checkpoint_id: cp.id, photo_url: "QR_UNLOCKED", lat: coords?.lat ?? null, lng: coords?.lng ?? null, xp_earned: 10,
      });

      const { data: prof } = await supabase.from("profiles").select("xp").eq("user_id", user.id).maybeSingle();
      await supabase.from("profiles").update({ xp: (prof?.xp || 0) + 10 }).eq("user_id", user.id);

      await refreshProfile();
      toast({ title: `🎉 Tuyệt vời! +10 XP`, description: `Chúc mừng bạn đã mở khóa thành công trạm ${cp.name}.` });
      setTimeout(() => { window.location.href = "/"; }, 2000);

    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
      setIsScanning(false);
    }
  };

  const scanQRCode = () => {
    if (mode !== "qr" || !videoRef.current || !cameraReady || isScanning) return;
    const video = videoRef.current;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        if (code && code.data) { handleQRSuccess(code.data); return; }
      }
    }
    requestRef.current = requestAnimationFrame(scanQRCode);
  };

  const onQRFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isScanning) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(objectUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      URL.revokeObjectURL(objectUrl);
      if (code && code.data) handleQRSuccess(code.data);
      else toast({ title: "Không tìm thấy mã QR", description: "Vui lòng chọn ảnh rõ nét hơn.", variant: "destructive" });
      e.target.value = "";
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); toast({ title: "Lỗi ảnh", variant: "destructive" }); e.target.value = ""; };
    img.src = objectUrl;
  };

  useEffect(() => {
    if (mode === "qr" && cameraReady && !isScanning) requestRef.current = requestAnimationFrame(scanQRCode);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [mode, cameraReady, isScanning]);

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setMediaBlob(blob);
        setMediaPreview(URL.createObjectURL(blob));
        setMediaType("image");
        setStep("preview");
      }
    }, "image/jpeg", 0.9);
  };

  const pickVideoMime = () => {
    const types = ["video/mp4;codecs=h264,aac", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    for (const t of types) if ((window as any).MediaRecorder?.isTypeSupported?.(t)) return t;
    return "";
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || isRecording) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = true));
    chunksRef.current = [];
    const mime = pickVideoMime();
    let rec: MediaRecorder;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch {
      toast({ title: "Trình duyệt không hỗ trợ quay video", variant: "destructive" });
      return;
    }
    recorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      stream.getAudioTracks().forEach((t) => (t.enabled = false));
      if (blob.size > 0) {
        setMediaBlob(blob);
        setMediaPreview(URL.createObjectURL(blob));
        setMediaType("video");
        setStep("preview");
      }
    };
    rec.start(100);
    recordStartRef.current = performance.now();
    setIsRecording(true);
    setRecordProgress(0);
    const tick = () => {
      const elapsed = performance.now() - recordStartRef.current;
      setRecordProgress(Math.min(1, elapsed / MAX_RECORD_MS));
      if (elapsed < MAX_RECORD_MS && recorderRef.current?.state === "recording") {
        progressRafRef.current = requestAnimationFrame(tick);
      }
    };
    progressRafRef.current = requestAnimationFrame(tick);
    recordTimeoutRef.current = window.setTimeout(stopRecording, MAX_RECORD_MS);
  };

  const stopRecording = () => {
    if (recordTimeoutRef.current) { clearTimeout(recordTimeoutRef.current); recordTimeoutRef.current = null; }
    if (progressRafRef.current) cancelAnimationFrame(progressRafRef.current);
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setIsRecording(false);
    setRecordProgress(0);
  };

  const onShutterPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!cameraReady) return;
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      startRecording();
    }, 280);
  };

  const onShutterPointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      capture();
      return;
    }
    if (isRecording) stopRecording();
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    setMediaBlob(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(isVideo ? "video" : "image");
    setStep("preview");
  };

  const resetAll = () => {
    setMediaBlob(null);
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setMediaType("image");
    setCaption(""); setRating(0); setSelected(null);
    setLocationTab("current"); setCurrentLocLabel(null);
    setStep("camera");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Trình duyệt không hỗ trợ định vị", variant: "destructive" });
      return;
    }
    setFetchingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        let label = `Vị trí hiện tại của tôi (Tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)})`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`, { headers: { "Accept-Language": "vi" } });
          if (r.ok) {
            const j = await r.json();
            if (j?.display_name) label = j.display_name;
          }
        } catch {}
        setCurrentLocLabel(label);
        setSelected({ id: "CURRENT_LOCATION", name: label, area: "Vị trí hiện tại", lat, lng, xp_reward: 50 });
        setFetchingLoc(false);
      },
      () => {
        setFetchingLoc(false);
        toast({ title: "Không lấy được vị trí", description: "Vui lòng cấp quyền định vị.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitCheckin = async () => {
    if (!user || !mediaBlob || !selected) return;
    setSubmitting(true);
    try {
      const isVideo = mediaType === "video";
      const ext = isVideo ? (mediaBlob.type.includes("mp4") ? "mp4" : "webm") : "jpg";
      const contentType = isVideo ? (mediaBlob.type || "video/webm") : "image/jpeg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("checkin-photos").upload(path, mediaBlob, { contentType });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("checkin-photos").getPublicUrl(path);

      const earnedXp = getCalculatedXp(selected.area);

      // Borrow a valid checkpoint id for hardcoded / current-location entries
      const isHardcoded =
        selected.id === "TUONG_DAI_LE_NIN" ||
        selected.id === "DH_KIEN_TRUC_HN" ||
        selected.id === "CURRENT_LOCATION" ||
        MY_PILLARS.some(p => p.id === selected.id);
      const validId = isHardcoded
        ? (checkpoints.length > 0 ? checkpoints[0].id : selected.id)
        : selected.id;

      const { data: checkIn, error: ciErr } = await supabase.from("check_ins").insert({
        user_id: user.id,
        checkpoint_id: validId,
        photo_url: pub.publicUrl,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        xp_earned: earnedXp,
      }).select().single();
      if (ciErr) throw ciErr;

      const fullCaption = [rating > 0 ? `[★${rating}]` : "", caption.trim()].filter(Boolean).join(" ");

      await supabase.from("posts").insert({
        user_id: user.id,
        check_in_id: checkIn.id,
        photo_url: pub.publicUrl,
        caption: fullCaption || null,
        location_name: selected.name,
        media_type: isVideo ? "video" : "image",
      } as any);

      const { data: prof } = await supabase.from("profiles").select("xp").eq("user_id", user.id).maybeSingle();
      await supabase.from("profiles").update({ xp: (prof?.xp ?? 0) + earnedXp }).eq("user_id", user.id);
      
      await refreshProfile();
      toast({ title: `+${earnedXp} XP! 🎉`, description: `Check-in thành công.` });
      
      setTimeout(() => { navigate("/"); }, 1500); 
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  // 🚀 LỌC & NHÓM DANH SÁCH ĐỊA ĐIỂM CHUẨN
  // 1. Loại bỏ các Trạm QR (MY_PILLARS) khỏi danh sách Database cho gọn
  const fetchedLocations = checkpoints.filter(
    (c) => !MY_PILLARS.some((p) => p.name === c.name)
  );
  
  // 2. Tự chèn thêm các địa điểm bạn muốn (Ghim cứng vào code)
  // 2. Tự chèn thêm các địa điểm bạn muốn (Ghim cứng vào code)
  const hardcodedLocations: Checkpoint[] = [
    { 
      id: "TUONG_DAI_LE_NIN", 
      name: "Tượng đài Lê Nin", 
      area: "Nghệ thuật", 
      lat: 21.031718, 
      lng: 105.839538, 
      xp_reward: 80 
    },
    {
      id: "DH_KIEN_TRUC_HN",
      name: "Trường Đại học Kiến trúc Hà Nội",
      area: "Trường học",
      lat: 20.9805,
      lng: 105.7894,
      xp_reward: 30,
    },
    // 👇 Tự động nhúng toàn bộ 10 trạm từ MY_PILLARS sang nhóm Trạm thám hiểm
    ...MY_PILLARS.map(p => ({
      id: p.id,
      name: p.name,
      area: "Trạm thám hiểm",
      lat: 0,
      lng: 0,
      xp_reward: 10
    }))
  ];

  // 3. Gộp chung cả 2 danh sách lại để hiển thị ra màn hình
  const checkinLocations = [...fetchedLocations, ...hardcodedLocations];
  
  // Nhóm lại theo Area (Văn hóa - Tâm linh, Ẩm thực...)
  const grouped = checkinLocations.reduce<Record<string, Checkpoint[]>>((acc, c) => { 
    const k = c.area || "Khác"; 
    (acc[k] ||= []).push(c); 
    return acc; 
  }, {});

  const tags = selected?.area ? SMART_TAGS[selected.area] ?? [] : [];
  const addTag = (tag: string) => { setCaption((prev) => { if (!prev.trim()) return tag; if (prev.toLowerCase().includes(tag.toLowerCase())) return prev; return `${prev.trim()}, ${tag.toLowerCase()}`; }); };

  if (step === "camera") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        <div className="absolute top-12 left-0 right-0 z-30 flex justify-center">
          <div className="bg-black/60 backdrop-blur-md rounded-full p-1 flex gap-1 border border-white/20">
            <button onClick={() => setMode("photo")} className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${mode === "photo" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/70 hover:text-white"}`}><Camera className="w-4 h-4" /> Check-in</button>
            <button onClick={() => setMode("qr")} className={`px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${mode === "qr" ? "bg-primary text-primary-foreground shadow-lg" : "text-white/70 hover:text-white"}`}><QrCode className="w-4 h-4" /> Quét QR</button>
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          {!cameraReady && <div className="absolute inset-0 flex items-center justify-center bg-black/60"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
        </div>

        {mode === "qr" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none bg-black/50">
            <div className="w-64 h-64 border-2 border-primary/50 relative bg-transparent overflow-hidden rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
               <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
               <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
               <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
               <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl"></div>
               <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_red] animate-[scan_2s_ease-in-out_infinite]" />
            </div>
            <p className="mt-8 text-white font-semibold bg-black/80 px-6 py-3 rounded-full backdrop-blur-md border border-white/10 text-sm">{isScanning ? "Đang xử lý..." : "Đưa mã QR vào khung"}</p>
            <label className="mt-4 pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-full bg-card/90 backdrop-blur text-foreground text-sm font-semibold cursor-pointer hover:bg-card transition border border-white/10">
              <ImageIcon className="w-4 h-4" /> Tải ảnh QR lên <input type="file" accept="image/*" onChange={onQRFileUpload} className="hidden" disabled={isScanning} />
            </label>
            <style>{`@keyframes scan { 0%, 100% { top: 0%; } 50% { top: 100%; } }`}</style>
          </div>
        )}

        {mode === "photo" && (
          <div className="absolute bottom-28 left-0 right-0 z-10 flex flex-col items-center gap-4 px-4">
            <div className="flex items-center gap-6">
              <label className={`w-12 h-12 rounded-full bg-card/90 backdrop-blur flex items-center justify-center cursor-pointer hover:bg-card transition ${isRecording ? "opacity-30 pointer-events-none" : ""}`}>
                <ImageIcon className="w-5 h-5 text-foreground" />
                <input type="file" accept="image/*,video/*" onChange={onFileUpload} className="hidden" />
              </label>
              <button
                onPointerDown={onShutterPointerDown}
                onPointerUp={onShutterPointerUp}
                onPointerLeave={onShutterPointerUp}
                onPointerCancel={onShutterPointerUp}
                onContextMenu={(e) => e.preventDefault()}
                disabled={!cameraReady}
                className="relative w-20 h-20 rounded-full bg-white shadow-2xl active:scale-95 transition disabled:opacity-50 touch-none select-none"
                style={{ WebkitUserSelect: "none" }}
              >
                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--primary) / 0.25)" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="46" fill="none"
                    stroke={isRecording ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - (isRecording ? recordProgress : 1))}
                    style={{ transition: isRecording ? "none" : "stroke-dashoffset 0.2s" }}
                  />
                </svg>
                <div className={`absolute inset-2 rounded-full flex items-center justify-center ${isRecording ? "bg-destructive" : "bg-white"}`}>
                  {isRecording && <div className="w-5 h-5 rounded-sm bg-white" />}
                </div>
              </button>
              <button
                onClick={toggleCamera}
                disabled={!cameraReady || isRecording}
                className="w-12 h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-white border border-white/40 shadow-lg hover:bg-white/50 transition disabled:opacity-30"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 text-xs font-medium">
              {isRecording ? `Đang quay... ${Math.ceil((1 - recordProgress) * 15)}s` : "Chạm để chụp · Giữ để quay video (tối đa 15s)"}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="h-full relative bg-black flex flex-col overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          {mediaPreview && mediaType === "video" ? (
            <video src={mediaPreview} controls autoPlay loop playsInline className="w-full h-full object-contain" />
          ) : mediaPreview ? (
            <img src={mediaPreview} alt="preview" className="w-full h-full object-contain" />
          ) : null}
        </div>
        <div className="absolute top-12 left-4 right-4 z-10 flex justify-between"><button onClick={resetAll} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"><X className="w-5 h-5" /></button></div>
        <div className="absolute bottom-28 left-4 right-4 z-10 flex gap-3"><button onClick={resetAll} className="flex-1 bg-card/90 backdrop-blur text-foreground rounded-2xl py-3.5 font-semibold">Quay lại</button><button onClick={() => setStep("form")} className="flex-[2] bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 shadow-lg">Tiếp tục <Send className="w-4 h-4" /></button></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-background pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 pt-12 pb-3 flex items-center gap-3"><button onClick={() => setStep("preview")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button><h1 className="text-lg font-bold text-foreground">Đánh giá check-in</h1></div>
      <div className="px-4 pt-4 space-y-5">
        {mediaPreview && (
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
            {mediaType === "video" ? (
              <video src={mediaPreview} controls loop muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        {/* 🚀 CHỌN ĐỊA ĐIỂM: TAB Vị trí hiện tại / Danh sách */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Địa điểm check-in</label>
          <div className="bg-muted/60 rounded-2xl p-1 flex gap-1 mb-3">
            <button
              onClick={() => { setLocationTab("current"); setSelected(null); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${locationTab === "current" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <Navigation className="w-3.5 h-3.5" /> Vị trí hiện tại
            </button>
            <button
              onClick={() => { setLocationTab("list"); setSelected(null); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${locationTab === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              <List className="w-3.5 h-3.5" /> Danh sách
            </button>
          </div>

          {locationTab === "current" ? (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {currentLocLabel ? (
                <>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground flex-1 break-words">{currentLocLabel}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Check-in tự do</span>
                    <span className="bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full text-xs">+50 XP</span>
                  </div>
                  <button onClick={useCurrentLocation} disabled={fetchingLoc} className="w-full text-xs text-primary font-semibold py-1.5">Cập nhật lại vị trí</button>
                </>
              ) : (
                <button
                  onClick={useCurrentLocation}
                  disabled={fetchingLoc}
                  className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold rounded-xl py-3 text-sm disabled:opacity-50"
                >
                  {fetchingLoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {fetchingLoc ? "Đang lấy vị trí..." : "Lấy vị trí hiện tại (+50 XP)"}
                </button>
              )}
            </div>
          ) : (
            <>
              <select 
                value={selected && selected.id !== "CURRENT_LOCATION" ? selected.id : ""} 
                onChange={(e) => { 
                  setSelected(checkinLocations.find((c) => c.id === e.target.value) ?? null); 
                  setCaption(""); 
                }} 
                className="w-full bg-card border border-border rounded-2xl px-4 py-3 text-sm font-semibold text-foreground"
              >
                <option value="">📍 Chọn địa điểm...</option>
                {Object.entries(grouped).map(([area, list]) => (
                  <optgroup key={area} label={area}>
                    {list.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (+{getCalculatedXp(c.area)} XP)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {selected && selected.id !== "CURRENT_LOCATION" && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>{selected.area}</span>
                  <span className="ml-auto bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    +{getCalculatedXp(selected.area)} XP
                  </span>
                </div>
              )}
            </>
          )}
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
