import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import MapScreen from "@/components/MapScreen";
import PersonaScreen from "@/components/PersonaScreen";
import CameraScreen from "@/components/CameraScreen";
import FeedScreen from "@/components/FeedScreen";
import AchievementsScreen from "@/components/AchievementsScreen";

type Tab = "map" | "persona" | "camera" | "feed" | "achievements";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  return (
    <div className="h-screen w-full max-w-lg mx-auto relative overflow-hidden bg-background">
      <div className="h-full">
        {activeTab === "map" && <MapScreen />}
        {activeTab === "persona" && <PersonaScreen />}
        {activeTab === "camera" && <CameraScreen />}
        {activeTab === "feed" && <FeedScreen />}
        {activeTab === "achievements" && <AchievementsScreen />}
      </div>
      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
