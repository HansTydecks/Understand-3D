import { create } from "zustand";

import { unitScale } from "@/domain/coords";
import type { SceneConfig } from "@/missions/types";

import { clamp } from "./tween";

export const DEG = Math.PI / 180;
export type Face = "top" | "front" | "right" | "left" | "back";

/** Kamera als Kugelkoordinaten um einen Zielpunkt: θ = Drehung (0 = VORNE), φ = Höhe (90° = OBEN). */
export interface ViewTarget {
  theta: number;
  phi: number;
  zoom: number;
  /** Halbe Breite bzw. Höhe (Szeneneinheiten), die ins Bild passen soll. */
  fitW: number;
  fitH: number;
  target: [number, number, number];
}

export function presetFor(scene: SceneConfig): ViewTarget {
  const s = unitScale(scene.unit);
  const frame = (scene.frame ?? Math.max(Math.abs(scene.min), Math.abs(scene.max))) * s;
  if (scene.camera === "line") {
    const mid = ((scene.min + scene.max) / 2) * s;
    const half = ((scene.max - scene.min) / 2) * s + 1.8;
    return { theta: 0, phi: 18 * DEG, zoom: 1, fitW: half, fitH: 2.6, target: [mid, 0.4, 0] };
  }
  if (scene.camera === "top") {
    return { theta: 0, phi: 90 * DEG, zoom: 1, fitW: frame + 2, fitH: frame + 3, target: [0, 0, -0.7] };
  }
  const zs = scene.zMax * s;
  return {
    theta: 30 * DEG,
    phi: 30 * DEG,
    zoom: 1,
    fitW: frame * 1.2 + 1,
    fitH: frame * 0.8 + zs * 0.25 + 1,
    target: [0, zs * 0.18, 0],
  };
}

interface ViewState {
  desired: ViewTarget;
  home: ViewTarget;
  dragging: boolean;
  setPreset: (v: ViewTarget) => void;
  goHome: () => void;
  zoomBy: (factor: number) => void;
  orbitBy: (dTheta: number, dPhi: number) => void;
  face: (face: Face) => void;
  setDragging: (dragging: boolean) => void;
}

const initial = presetFor({ dims: 1, unit: "cell", min: 0, max: 8, zMax: 0, camera: "line", ruler: false });

export const useView = create<ViewState>()((set) => ({
  desired: initial,
  home: initial,
  dragging: false,
  setPreset: (v) => set({ desired: v, home: v }),
  goHome: () => set((s) => ({ desired: s.home })),
  zoomBy: (factor) =>
    set((s) => ({ desired: { ...s.desired, zoom: clamp(s.desired.zoom * factor, 0.35, 2.5) } })),
  orbitBy: (dTheta, dPhi) =>
    set((s) => ({
      desired: {
        ...s.desired,
        theta: s.desired.theta + dTheta,
        phi: clamp(s.desired.phi + dPhi, 0, 90 * DEG),
      },
    })),
  face: (face) =>
    set((s) => {
      const angles: Record<Face, [number, number]> = {
        front: [0, 0.5 * DEG],
        top: [0, 90 * DEG],
        right: [90 * DEG, 0.5 * DEG],
        left: [-90 * DEG, 0.5 * DEG],
        back: [180 * DEG, 0.5 * DEG],
      };
      const [theta, phi] = angles[face];
      // Kürzester Drehweg vom aktuellen Winkel aus.
      const turns = Math.round((s.desired.theta - theta) / (Math.PI * 2));
      return { desired: { ...s.desired, theta: theta + turns * Math.PI * 2, phi } };
    }),
  setDragging: (dragging) => set({ dragging }),
}));

/** Aktuelle Kamerawinkel für den Ansichtswürfel – ohne React-Neuzeichnen pro Bild. */
export const liveAngles = { theta: initial.theta, phi: initial.phi };
const listeners = new Set<() => void>();
export function subscribeAngles(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
export function publishAngles(theta: number, phi: number): void {
  if (Math.abs(theta - liveAngles.theta) < 1e-5 && Math.abs(phi - liveAngles.phi) < 1e-5) return;
  liveAngles.theta = theta;
  liveAngles.phi = phi;
  for (const fn of listeners) fn();
}
