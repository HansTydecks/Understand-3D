import { useEffect, useState } from "react";

import { FinishScreen } from "@/screens/FinishScreen";
import { MapScreen } from "@/screens/MapScreen";
import { MissionScreen } from "@/screens/MissionScreen";
import { StartScreen } from "@/screens/StartScreen";
import { SettingsDialog, SmallScreenNotice, TopBar } from "@/ui/Chrome";

import { useNav } from "./nav";
import { useSettings } from "./settings";

export function App() {
  const screen = useNav((s) => s.screen);
  const lang = useSettings((s) => s.lang);
  const calm = useSettings((s) => s.calm);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className={`app ${calm ? "calm" : ""}`}>
      <TopBar onSettings={() => setSettings(true)} />
      {screen === "start" && <StartScreen />}
      {screen === "map" && <MapScreen />}
      {screen === "mission" && <MissionScreen />}
      {screen === "finish" && <FinishScreen />}
      {settings && <SettingsDialog onClose={() => setSettings(false)} />}
      <SmallScreenNotice />
    </div>
  );
}
