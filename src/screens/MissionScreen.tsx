import { usePlay } from "@/app/play";
import { SceneOverlay } from "@/scene/overlay";
import { Stage } from "@/scene/Stage";

import { CoordPanel } from "@/ui/CoordPanel";
import { KubiGuide } from "@/ui/KubiGuide";
import {
  Blueprint,
  GoalCard,
  SidePanel,
  SnapGrid,
  Toolbar,
  ViewControls,
  needsSidePanel,
} from "@/ui/MissionChrome";
import { ChapterCard, SuccessOverlay } from "@/ui/Overlays";

export function MissionScreen() {
  const mission = usePlay((s) => s.mission);
  if (!mission) return null;
  return (
    <main className="mission-screen" data-mission={mission.id}>
      <Toolbar />
      <div className="workspace">
        <div className="viewport">
          <Stage />
          <SceneOverlay />
          <ViewControls />
          <GoalCard />
          <Blueprint />
          <SnapGrid />
          <KubiGuide />
          <CoordPanel />
        </div>
        {needsSidePanel(mission.tools) && <SidePanel />}
        <SuccessOverlay />
        <ChapterCard />
      </div>
    </main>
  );
}
