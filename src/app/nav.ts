import { create } from "zustand";

export type Screen = "start" | "map" | "mission" | "finish";

interface NavState {
  screen: Screen;
  /** Nach dem letzten Auftrag eines Kapitels zeigt die Missionsseite die Tinkercad-Karte. */
  chapterCard: number | null;
  go: (screen: Screen) => void;
  showChapterCard: (chapter: number | null) => void;
}

export const useNav = create<NavState>()((set) => ({
  screen: "start",
  chapterCard: null,
  go: (screen) => set({ screen, chapterCard: null }),
  showChapterCard: (chapterCard) => set({ chapterCard }),
}));
