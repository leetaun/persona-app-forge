import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, MapPin, Eye, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Thêm qr_code vào Interface
interface Checkpoint {
  id: string;
  name: string;
  description: string | null;
  area: string | null;
  lat: number;
  lng: number;
  xp_reward: number;
  is_hot: boolean;
  qr_code?: string;
}

type AreaKey = "ho_tay" | "hoan_kiem" | "ba_dinh" | "bat_trang";

interface AreaDef {
  key: AreaKey;
  name: string;
  center: [number, number]; // [lng, lat]
  radiusKm: number;
  zoom: number;
}

const AREAS: AreaDef[] = [
  { key: "ho_tay", name: "Hồ Tây", center: [105.8240, 21.0650], radiusKm: 1.6, zoom: 14 },
  { key: "hoan_kiem", name: "Hoàn Kiếm", center: [105.8521, 21.0285], radiusKm: 1.0, zoom: 15 },
  { key: "ba_dinh", name: "Ba Đình", center: [105.8342, 21.0368], radiusKm: 1.2, zoom: 14.5 },
  { key: "bat_trang", name: "Bát Tràng", center: [105.9123, 20.9757], radiusKm: 1.0, zoom: 15 },
];

const HANOI_CENTER: [number, number] = [105.84, 21.0335];
const TOKEN_KEY = "mapbox_public_token";
const ENV_MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
  "pk.eyJ1IjoibGVldGF1biIsImEiOiJjbW80OG91dWkwbTM1M3dwa291amk1N2N2In0.16XX7az081Vjv-xmyandlQ";

// ===== DANH SÁCH 10 CỘT MỐC CỦA BẠN (GẮN CỨNG VÀO CODE) =====
const MY_PILLARS: Checkpoint[] = [
  { id: "COT_CO_HA_NOI", name: "Cột cờ Hà Nội", lat: 21.0335, lng: 105.8430, xp_reward: 50, is_hot: true, description: "Biểu tượng lịch sử", area: "Ba Đình", qr_code: "COT_CO_HA_NOI" },
  { id: "DUONG_DOC_LAP", name: "Đường Độc Lập", lat: 21.0360, lng: 105.8347, xp_reward: 50, is_hot: false, description: "Con đường lịch sử", area: "Ba Đình", qr_code: "DUONG_DOC_LAP" },
  { id: "DUONG_PHAN_DINH_PHUNG", name: "Đường Phan Đình Phùng", lat: 21.0400, lng: 105.8400, xp_reward: 50, is_hot: true, description: "Con đường rợp bóng cây", area: "Ba Đình", qr_code: "DUONG_PHAN_DINH_PHUNG" },
  { id: "KAMON_CAFE", name: "Kamon Cafe", lat: 21.0425, lng: 105.8380, xp_reward: 30, is_hot: false, description: "Cafe check-in đẹp", area: "Ba Đình", qr_code: "KAMON_CAFE" },
  { id: "49_THANHNIEN_21045507_105836586", name: "49 Thanh Niên", lat: 21.045507, lng: 105.836586, xp_reward: 40, is_hot: true, description: "View Hồ Tây", area: "Tây Hồ", qr_code: "49_THANHNIEN_21045507_105836586" },
  { id: "QUANGBA_21065935_105819695", name: "Quảng Bá", lat: 21.065935, lng: 105.819695, xp_reward: 40, is_hot: false, description: "Khu vực Quảng Bá", area: "Tây Hồ", qr_code: "QUANGBA_21065935_105819695" },
  { id: "69_TONGOCVAN_21066414_105819176", name: "69 Tô Ngọc Vân", lat: 21.066414, lng: 105.819176, xp_reward: 40, is_hot: false, description: "Tô Ngọc Vân", area: "Tây Hồ", qr_code: "69_TONGOCVAN_21066414_105819176" },
  { id: "3_QUANGBA_21070314_105822777", name: "Ngõ 3 Quảng Bá", lat: 21.070314, lng: 105.822777, xp_reward: 40, is_hot: false, description: "Ngõ nhỏ view hồ", area: "Tây Hồ", qr_code: "3_QUANGBA_21070314_105822777" },
  { id: "NGA_3_NHATCHIEU_21074211_105819733", name: "Ngã 3 Nhật Chiêu", lat: 21.074211, lng: 105.819733, xp_reward: 50, is_hot: true, description: "Điểm giao cắt 2 con rồng", area: "Tây Hồ", qr_code: "NGA_3_NHATCHIEU_21074211_105819733" },
  { id: "VEHO_21069166_105812065", name: "Vệ Hồ", lat: 21.069166, lng: 105.812065, xp_reward: 40, is_hot: false, description: "Đường Vệ Hồ", area: "Tây Hồ", qr_code: "VEHO_21069166_105812065" }
];


function circleRing(center: [number, number], radiusKm: number, points = 64): [number, number][] {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const earthR = 6378.137;
  const dRad = radiusKm / earthR;
  const latRad = (lat * Math.PI) / 180;
  for (let i = 0; i <= points; i++) {
    const bearing = (i * 360) / points;
    const bRad = (bearing * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(latRad) * Math.cos(dRad) + Math.cos(latRad) * Math.sin(dRad) * Math.cos(bRad),
    );
    const lng2 =
      (lng * Math.PI) / 180 +
      Math.atan2(
        Math.sin(bRad) * Math.sin(dRad) * Math.cos(latRad),
        Math.cos(dRad) - Math.sin(latRad) * Math.sin(lat2),
      );
    coords.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  return coords;
}

const HANOI_OUTER_RING: [number, number][] = [
  [105.55, 20.85],
  [106.15, 20.85],
  [106.15, 21.25],
  [105.55, 21.25],
  [105.55, 20.85],
];

function buildFogGeoJson(): GeoJSON.Feature<GeoJSON.Polygon> {
  const holes = AREAS.map((a) => circleRing(a.center, a.radiusKm));
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [HANOI_OUTER_RING, ...holes],
    },
  };
}

const MapScreen = () => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || ENV_MAPBOX_TOKEN);
  const [tokenInput, setTokenInput] = useState("");
  
  // Dùng luôn MY_PILLARS làm danh sách mặc định
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(MY_PILLARS);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exploreMode, setExploreMode] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasCenteredRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: HANOI_CENTER,
      zoom: 11.5,
      pitch: 0,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("fog", {
        type: "geojson",
        data: buildFogGeoJson(),
      });
      map.addLayer({
        id: "fog-layer",
        type: "fill",
        source: "fog",
        paint: {
          "fill-color": "#1f2937",
          "fill-opacity": 0.8,
        },
      });
      map.addLayer({
        id: "fog-outline",
        type: "line",
        source: "fog",
        paint: {
          "line-color": "#fbbf24",
          "line-width": 1.5,
          "line-opacity": 0.6,
        },
      });
      setMapReady(true);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [token]);

  // Load data: Chỉ lấy lịch sử check_in để biết cái nào đã quét QR
  useEffect(() => {
    const load = async () => {
      if (user) {
        const { data: cis } = await supabase.from("check_ins").select("checkpoint_id").eq("user_id", user.id);
        setUnlockedIds(new Set(((cis as any[]) || []).map((c: any) => c.checkpoint_id)));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  // Vẽ các mốc cột lên bản đồ
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!exploreMode) return; 

    checkpoints.forEach((cp) => {
      // ĐÃ XÓA LOGIC GIẤU CỘT TRONG SƯƠNG MÙ - ĐẢM BẢO 10 CỘT LÚC NÀO CŨNG HIỆN
      const completed = unlockedIds.has(cp.id);

      const el = document.createElement("div");
      el.style.cssText = `
        width:36px;height:36px;border-radius:9999px;
        background:${completed ? "hsl(152 55% 42%)" : "hsl(220 9% 30%)"};
        border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;color:white;cursor:pointer;
        ${cp.is_hot && completed ? "animation:pulseGlow 1.6s ease-in-out infinite;" : ""}
      `;
      el.innerHTML = completed
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

      const popup = new mapboxgl.Popup({ offset: 22, closeButton: false }).setHTML(
        `<div style="font-size:12px;min-width:160px;">
          <p style="font-weight:700;font-size:14px;margin:0 0 4px;">${cp.name}</p>
          ${cp.area ? `<p style="color:#777;margin:0 0 4px;">📍 ${cp.area}</p>` : ""}
          ${cp.description ? `<p style="color:#555;margin:0 0 6px;">${cp.description}</p>` : ""}
          <p style="color:hsl(152 55% 42%);font-weight:600;margin:0;">+${cp.xp_reward} XP</p>
          ${cp.qr_code ? `<p style="color:#2563eb;font-weight:600;margin:4px 0 0;font-family:monospace">Mã QR: ${cp.qr_code}</p>` : ""}
          ${completed ? `<p style="color:#059669;font-weight:500;margin:4px 0 0;">✓ Đã hoàn thành</p>` : `<p style="color:#777;font-style:italic;margin:4px 0 0;">🔒 Cần Quét QR để mở</p>`}
        </div>`,
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([cp.lng, cp.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [checkpoints, unlockedIds, exploreMode, mapReady]);

  // Geolocation
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (!("geolocation" in navigator)) return;

    const updatePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      const lngLat: [number, number] = [longitude, latitude];

      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.style.cssText = `position:relative;width:20px;height:20px;`;
        el.innerHTML = `
          <div style="position:absolute;inset:0;border-radius:9999px;background:#4285F4;opacity:.25;animation:userPulse 2s ease-out infinite;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:9999px;background:#4285F4;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);"></div>
        `;
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(lngLat)
          .addTo(mapRef.current!);
      } else {
        userMarkerRef.current.setLngLat(lngLat);
      }

      if (!hasCenteredRef.current) {
        hasCenteredRef.current = true;
        mapRef.current!.flyTo({ center: lngLat, zoom: 15, speed: 1.4, essential: true });
      }
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn("Geolocation error:", err.message);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(updatePosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      hasCenteredRef.current = false;
    };
  }, [mapReady]);

  const saveToken = () => {
    const t = tokenInput.trim();
    if (!t.startsWith("pk.")) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  if (!token) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full glass-surface rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Kết nối Mapbox</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Dán Mapbox public token (bắt đầu bằng <code>pk.</code>).
          </p>
          <Input
            placeholder="pk.eyJ1Ijoi..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
          <Button onClick={saveToken} className="w-full">
            Lưu & mở bản đồ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 hsla(152,55%,42%,.6)}50%{box-shadow:0 0 0 14px hsla(152,55%,42%,0)}}@keyframes userPulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(3);opacity:0}}`}</style>

      <div ref={containerRef} className="absolute inset-0" />

      {/* Top search bar */}
      <div className="absolute top-12 left-4 right-4 z-[400]">
        <div className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Tìm kiếm địa điểm...</span>
        </div>
      </div>

      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-28 left-4 z-[400]"
      >
        <div className="glass-surface rounded-xl px-3 py-2 shadow-md flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Eye className={`w-4 h-4 ${!exploreMode ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-semibold ${!exploreMode ? "text-primary" : "text-muted-foreground"}`}>
              Tham quan
            </span>
          </div>
          <Switch checked={exploreMode} onCheckedChange={setExploreMode} />
          <div className="flex items-center gap-1.5">
            <Compass className={`w-4 h-4 ${exploreMode ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-xs font-semibold ${exploreMode ? "text-primary" : "text-muted-foreground"}`}>
              Khám phá
            </span>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[500]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default MapScreen;
