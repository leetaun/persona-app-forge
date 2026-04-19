import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import MapScreen from "@/components/MapScreen";
import PersonaScreen from "@/components/PersonaScreen";
import CameraScreen from "@/components/CameraScreen";
import FeedScreen from "@/components/FeedScreen";
import AchievementsScreen from "@/components/AchievementsScreen";
import SuggestionsScreen, { SuggestionCategory } from "@/components/SuggestionsScreen";

type Tab = "map" | "persona" | "camera" | "feed" | "achievements";
type PersonaId = SuggestionCategory;

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [openPersona, setOpenPersona] = useState<PersonaId | null>(null);

  if (openPersona) {
    return (
      <div className="h-screen w-full max-w-lg mx-auto relative overflow-hidden bg-background">
        <SuggestionsScreen category={openPersona} onBack={() => setOpenPersona(null)} />
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-lg mx-auto relative overflow-hidden bg-background">
      <div className="h-full">
        {activeTab === "map" && <MapScreen />}
        {activeTab === "persona" && (
          <PersonaScreen onOpenPersona={(id) => setOpenPersona(id)} />
        )}
        {activeTab === "camera" && <CameraScreen />}
        {activeTab === "feed" && <FeedScreen />}
        {activeTab === "achievements" && <AchievementsScreen />}
      </div>
      <BottomNav active={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
