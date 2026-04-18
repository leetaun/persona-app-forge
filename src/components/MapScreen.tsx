import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, MapPin, Lock, CheckCircle2, Eye, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Checkpoint {
  id: string;
  name: string;
  description: string | null;
  area: string | null;
  lat: number;
  lng: number;
  xp_reward: number;
  is_hot: boolean;
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
  { key: "ho_tay", name: "Hồ Tây", center: [105.8234, 21.0581], radiusKm: 1.6, zoom: 14 },
  { key: "hoan_kiem", name: "Hoàn Kiếm", center: [105.8521, 21.0285], radiusKm: 1.0, zoom: 15 },
  { key: "ba_dinh", name: "Ba Đình", center: [105.8342, 21.0368], radiusKm: 1.2, zoom: 14.5 },
  { key: "bat_trang", name: "Bát Tràng", center: [105.9123, 20.9757], radiusKm: 1.0, zoom: 15 },
];

const HANOI_CENTER: [number, number] = [105.84, 21.0335];
const TOKEN_KEY = "mapbox_public_token";
const ENV_MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_TOKEN as string | undefined) ||
  "pk.eyJ1IjoibGVldGF1biIsImEiOiJjbW80OG91dWkwbTM1M3dwa291amk1N2N2In0.16XX7az081Vjv-xmyandlQ";

// Build a circle polygon (ring) around a center point in lng/lat using meters approximation
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

// Outer ring covering all of Hanoi (and beyond) — used as the fog mask outer boundary
const HANOI_OUTER_RING: [number, number][] = [
  [105.55, 20.85],
  [106.15, 20.85],
  [106.15, 21.25],
  [105.55, 21.25],
  [105.55, 20.85],
];

function buildFogGeoJson(): GeoJSON.Feature<GeoJSON.Polygon> {
  // Polygon with holes: first ring = outer, subsequent rings = holes (inverted polygon)
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

function isInsideUnlockedArea(lng: number, lat: number): boolean {
  // simple radius-based check (km)
  return AREAS.some((a) => {
    const dx = (lng - a.center[0]) * 111 * Math.cos((lat * Math.PI) / 180);
    const dy = (lat - a.center[1]) * 111;
    return Math.sqrt(dx * dx + dy * dy) <= a.radiusKm;
  });
}

const MapScreen = () => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exploreMode, setExploreMode] = useState(true); // true = Khám phá, false = Tham quan
  const [mapReady, setMapReady] = useState(false);

  // Init map when token available
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
      // Fog source + layer (inverted polygon)
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
      // Optional: outline glow on holes
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

  // Load data
  useEffect(() => {
    const load = async () => {
      const [{ data: cps }, { data: cis }] = await Promise.all([
        supabase.from("checkpoints").select("*").order("created_at"),
        user
          ? supabase.from("check_ins").select("checkpoint_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setCheckpoints((cps as Checkpoint[]) || []);
      setUnlockedIds(new Set(((cis as any[]) || []).map((c: any) => c.checkpoint_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  // Render markers based on mode + unlocked areas
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    // clear existing
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!exploreMode) return; // Tham quan = no markers

    checkpoints.forEach((cp) => {
      if (!isInsideUnlockedArea(cp.lng, cp.lat)) return;
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
          ${completed ? `<p style="color:#059669;font-weight:500;margin:4px 0 0;">✓ Đã hoàn thành</p>` : `<p style="color:#777;font-style:italic;margin:4px 0 0;">🔒 Chưa mở khoá</p>`}
        </div>`,
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([cp.lng, cp.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });
  }, [checkpoints, unlockedIds, exploreMode, mapReady]);

  const flyToArea = (a: AreaDef) => {
    mapRef.current?.flyTo({ center: a.center, zoom: a.zoom, speed: 1.2, curve: 1.6, essential: true });
  };

  const saveToken = () => {
    const t = tokenInput.trim();
    if (!t.startsWith("pk.")) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  // Token gate
  if (!token) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full glass-surface rounded-2xl p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Kết nối Mapbox</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Dán Mapbox public token (bắt đầu bằng <code>pk.</code>) lấy từ{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              account.mapbox.com
            </a>
            . Token sẽ được lưu trên thiết bị này.
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
      <style>{`@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 hsla(152,55%,42%,.6)}50%{box-shadow:0 0 0 14px hsla(152,55%,42%,0)}}`}</style>

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

      {/* Area selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-4 right-4 z-[400]"
      >
        <div className="glass-surface rounded-2xl p-3 shadow-lg">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2 px-1">
            Khu vực đã mở khoá
          </p>
          <div className="grid grid-cols-2 gap-2">
            {AREAS.map((a) => (
              <button
                key={a.key}
                onClick={() => flyToArea(a)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background/60 hover:bg-primary hover:text-primary-foreground transition-colors text-left"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Reset token (small) */}
      <button
        onClick={() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken("");
        }}
        className="absolute top-4 right-4 z-[400] text-[10px] text-muted-foreground/70 hover:text-foreground bg-background/60 rounded px-2 py-1"
      >
        Đổi token
      </button>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[500]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default MapScreen;
