import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Navigation, Lock, Star, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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

const HANOI_CENTER: [number, number] = [21.0335, 105.8400];

// Custom pin icons
const makeIcon = (unlocked: boolean, hot: boolean) =>
  L.divIcon({
    className: "",
    html: `<div style="
      position:relative;width:36px;height:36px;border-radius:9999px;
      background:${unlocked ? "hsl(152 55% 42%)" : "hsl(160 10% 50%)"};
      border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);
      display:flex;align-items:center;justify-content:center;color:white;
      ${hot ? "animation:pulseGlow 1.6s ease-in-out infinite;" : ""}
    ">
      ${unlocked
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`}
      ${hot ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;border-radius:9999px;background:hsl(43 96% 56%);display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg></div>` : ""}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const MapBoundsFit = ({ points }: { points: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [60, 60] });
    }
  }, [map, points]);
  return null;
};

const MapScreen = () => {
  const { user } = useAuth();
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: cps }, { data: cis }] = await Promise.all([
        supabase.from("checkpoints").select("*").order("created_at"),
        user
          ? supabase.from("check_ins").select("checkpoint_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      setCheckpoints((cps as Checkpoint[]) || []);
      setUnlockedIds(new Set(((cis as any[]) || []).map((c) => c.checkpoint_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  // First N checkpoints are "available to discover" — others stay locked until ANY is unlocked nearby.
  // Simplified rule: a checkpoint is "discoverable" if user has unlocked it OR it's within 1.5km of an unlocked one OR there are < 3 unlocks (starter set).
  const isDiscoverable = (cp: Checkpoint) => {
    if (unlockedIds.has(cp.id)) return true;
    if (unlockedIds.size === 0) {
      // first 3 are starter
      return checkpoints.slice(0, 3).some((c) => c.id === cp.id);
    }
    return checkpoints
      .filter((c) => unlockedIds.has(c.id))
      .some((c) => haversine(c.lat, c.lng, cp.lat, cp.lng) < 1500);
  };

  const points = useMemo<[number, number][]>(
    () => checkpoints.map((c) => [c.lat, c.lng]),
    [checkpoints]
  );

  return (
    <div className="relative h-full w-full overflow-hidden">
      <style>{`@keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 hsla(152,55%,42%,.5)}50%{box-shadow:0 0 0 12px hsla(152,55%,42%,0)}}
        .leaflet-container{height:100%;width:100%;background:hsl(140 20% 97%);}
        .leaflet-control-attribution{font-size:9px;opacity:.5}
      `}</style>

      {!loading && (
        <MapContainer
          center={HANOI_CENTER}
          zoom={13}
          zoomControl={false}
          className="absolute inset-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsFit points={points} />

          {/* Fog of war: dark circle for non-discoverable checkpoints */}
          {checkpoints.map((cp) => {
            if (isDiscoverable(cp)) return null;
            return (
              <Circle
                key={`fog-${cp.id}`}
                center={[cp.lat, cp.lng]}
                radius={600}
                pathOptions={{
                  color: "hsl(210 15% 60%)",
                  fillColor: "hsl(210 15% 80%)",
                  fillOpacity: 0.85,
                  weight: 1,
                  dashArray: "4 6",
                }}
              />
            );
          })}

          {checkpoints.map((cp) => {
            const discoverable = isDiscoverable(cp);
            const unlocked = unlockedIds.has(cp.id);
            return (
              <Marker
                key={cp.id}
                position={[cp.lat, cp.lng]}
                icon={makeIcon(discoverable, cp.is_hot)}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-sm mb-1">{cp.name}</p>
                    {cp.area && <p className="text-muted-foreground mb-1">📍 {cp.area}</p>}
                    {discoverable ? (
                      <>
                        <p className="text-muted-foreground mb-1">{cp.description}</p>
                        <p className="text-primary font-semibold">+{cp.xp_reward} XP</p>
                        {unlocked && <p className="text-emerald-600 font-medium">✓ Đã check-in</p>}
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">
                        🌫️ Hoàn thành các nhiệm vụ gần đây để mở khoá
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}

      {/* Search bar */}
      <div className="absolute top-12 left-4 right-4 z-[400]">
        <div className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <Search className="w-5 h-5 text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Tìm kiếm địa điểm...</span>
        </div>
      </div>

      {/* Fog of War label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-28 left-4 z-[400]"
      >
        <div className="glass-surface rounded-xl px-3 py-2 shadow-md">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Fog of War</p>
          <p className="text-xs text-muted-foreground">
            {unlockedIds.size}/{checkpoints.length} đã mở khoá
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[500]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
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

export default MapScreen;
