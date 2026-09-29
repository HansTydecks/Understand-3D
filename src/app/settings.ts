import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { type Lang, type MessageKey, type Params, translate } from "@/i18n";
import { MISSIONS } from "@/missions/data";

export type Stars = 1 | 2 | 3;

interface SettingsState {
  lang: Lang;
  calm: boolean;
  unlockAll: boolean;
  progress: Record<string, Stars>;
  name: string;
  setLang: (lang: Lang) => void;
  setCalm: (calm: boolean) => void;
  setUnlockAll: (value: boolean) => void;
  setName: (name: string) => void;
  complete: (missionId: string, stars: Stars) => void;
  reset: () => void;
}

const initialLang = (): Lang => {
  if (typeof navigator === "undefined") return "de";
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "de";
};

/**
 * Einstellungen und Fortschritt. Liegen nur im localStorage dieses Browsers – keine Übertragung, kein Konto.
 * Fällt der Speicher aus (privates Fenster), läuft die App ohne Speichern weiter.
 */
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      lang: initialLang(),
      calm:
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      unlockAll: false,
      progress: {},
      name: "",
      setLang: (lang) => set({ lang }),
      setCalm: (calm) => set({ calm }),
      setUnlockAll: (unlockAll) => set({ unlockAll }),
      setName: (name) => set({ name: name.slice(0, 40) }),
      complete: (missionId, stars) =>
        set((s) => ({
          progress: { ...s.progress, [missionId]: Math.max(s.progress[missionId] ?? 0, stars) as Stars },
        })),
      reset: () => set({ progress: {}, unlockAll: false, name: "" }),
    }),
    {
      name: "understand-3d",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        lang: s.lang,
        calm: s.calm,
        unlockAll: s.unlockAll,
        progress: s.progress,
        name: s.name,
      }),
    },
  ),
);

export function isUnlocked(missionId: string, progress: Record<string, Stars>, unlockAll: boolean): boolean {
  if (unlockAll) return true;
  const i = MISSIONS.findIndex((m) => m.id === missionId);
  if (i <= 0) return i === 0;
  const prev = MISSIONS[i - 1];
  return prev !== undefined && progress[prev.id] !== undefined;
}

export const totalStars = (progress: Record<string, Stars>): number =>
  Object.values(progress).reduce<number>((sum, s) => sum + s, 0);

export const allDone = (progress: Record<string, Stars>): boolean =>
  MISSIONS.every((m) => progress[m.id] !== undefined);

/** Übersetzungs-Hook: funktioniert auch in eigenen React-Wurzeln (drei <Html>), da die Sprache im Store liegt. */
export function useT(): (key: MessageKey, params?: Params) => string {
  const lang = useSettings((s) => s.lang);
  return (key, params) => translate(lang, key, params);
}

export const useLang = (): Lang => useSettings((s) => s.lang);
