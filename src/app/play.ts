import { create } from "zustand";

import { type Axis, ORIGIN, type Vec3, equals, vec } from "@/domain/coords";
import {
  type ErrorKind,
  diagnosePoint,
  diagnoseAgainstAny,
  evaluateBuild,
  starsFor,
} from "@/domain/evaluate";
import {
  type AlignMode,
  type Field,
  type Ruler,
  type Shape,
  type ShapeKind,
  alignTo,
  applyField,
  sameBox,
} from "@/domain/geometry";
import { parseNumber } from "@/i18n/format";
import type { MessageKey } from "@/i18n";
import { MISSIONS, missionById, newShape } from "@/missions/data";
import type { BuildMission, Mission, SceneConfig } from "@/missions/types";

import { type Stars, useSettings } from "./settings";

export type Mood = "idle" | "talk" | "happy" | "think" | "wave" | "point";
export type Phase = "intro" | "play" | "moving" | "success";

export interface SpeechLine {
  key: MessageKey;
  params?: Record<string, number | string>;
  /** Parameter, die selbst übersetzt werden (z. B. Knopfbeschriftungen). */
  keyParams?: Record<string, MessageKey>;
}

export interface Speech {
  lines: SpeechLine[];
  mood: Mood;
  /** Zählt hoch, damit die Sprechblase auch bei gleichem Text neu erscheint. */
  seq: number;
}

interface Pending {
  point: Vec3;
  hit: number | null;
  error: ErrorKind | null;
}

export interface PlayState {
  mission: Mission | null;
  phase: Phase;
  introStep: number;
  scene: SceneConfig;
  mistakes: number;
  lastError: ErrorKind | null;
  speech: Speech | null;
  stars: Stars;
  // Punktmissionen (Gehe-zu, Ablesen)
  input: Record<Axis, string>;
  kubiPos: Vec3;
  kubiPath: Vec3[] | null;
  pathSeq: number;
  collected: boolean[];
  pending: Pending | null;
  // Baumissionen
  shapes: Shape[];
  selectedId: string | null;
  ruler: Ruler;
  rulerPicking: boolean;
  alignActive: boolean;
  alignPreview: { axis: Axis; mode: AlignMode } | null;
  shapeCounter: number;
  showBlueprint: boolean;
  successSeq: number;

  start: (missionId: string) => void;
  nextIntro: () => void;
  skipIntro: () => void;
  setInput: (axis: Axis, value: string) => void;
  submitPoint: () => void;
  arrive: () => void;
  showMe: () => void;
  select: (id: string | null) => void;
  setField: (id: string, field: Field, value: number) => void;
  addShape: (kind: ShapeKind) => void;
  deleteSelected: () => void;
  toggleRulerMode: () => void;
  toggleRulerPick: () => void;
  placeRuler: (point: Vec3) => void;
  toggleAlign: () => void;
  previewAlign: (preview: { axis: Axis; mode: AlignMode } | null) => void;
  applyAlign: (axis: Axis, mode: AlignMode) => void;
  toggleBlueprint: () => void;
  checkBuild: () => void;
}

const EMPTY_SCENE: SceneConfig = MISSIONS[0]?.scene ?? {
  dims: 1,
  unit: "cell",
  min: 0,
  max: 8,
  zMax: 0,
  camera: "line",
  ruler: false,
};

let speechSeq = 0;
const say = (mood: Mood, ...lines: SpeechLine[]): Speech => ({ lines, mood, seq: ++speechSeq });

/** Ziele einer Punktmission: bei Gehe-zu beliebige Reihenfolge, beim Ablesen der Reihe nach. */
export function pointTargets(m: Mission): Vec3[] {
  if (m.type === "goto") return m.targets;
  if (m.type === "read") return m.items.map((i) => i.pos);
  return [];
}

export function currentReadIndex(collected: boolean[]): number {
  const i = collected.findIndex((c) => !c);
  return i < 0 ? collected.length : i;
}

export const helpVisible = (mistakes: number): boolean => mistakes >= 2;
export const showMeAvailable = (mistakes: number): boolean => mistakes >= 3;

const buildTargetsLeft = (m: BuildMission, shapes: Shape[]) => {
  const free = shapes.filter((s) => !s.fixed);
  const used = new Set<string>();
  return m.targets.filter((t) => {
    const match = free.find((s) => !used.has(s.id) && s.kind === t.kind && sameBox(s, t));
    if (match) {
      used.add(match.id);
      return false;
    }
    return true;
  });
};

export const usePlay = create<PlayState>()((set, get) => {
  const hintFor = (m: Mission, error: ErrorKind): MessageKey =>
    m.hints?.[error] ?? (`hint.${error}` as MessageKey);

  const registerMistake = (error: ErrorKind, extra: Partial<PlayState> = {}) => {
    const { mission, mistakes } = get();
    if (!mission) return;
    const count = mistakes + 1;
    const lines: SpeechLine[] = [{ key: hintFor(mission, error) }];
    if (count === 2) lines.push({ key: mission.type === "build" ? "help.ghost" : "help.lines" });
    if (count >= 3) lines.push({ key: "help.showMe" });
    set({ mistakes: count, lastError: error, speech: say("think", ...lines), phase: "play", ...extra });
  };

  const succeed = () => {
    const { mission, mistakes } = get();
    if (!mission) return;
    const stars = starsFor(mistakes);
    useSettings.getState().complete(mission.id, stars);
    set((s) => ({
      phase: "success",
      stars,
      lastError: null,
      speech: say("happy", { key: mission.success }),
      alignActive: false,
      rulerPicking: false,
      successSeq: s.successSeq + 1,
    }));
  };

  return {
    mission: null,
    phase: "intro",
    introStep: 0,
    scene: EMPTY_SCENE,
    mistakes: 0,
    lastError: null,
    speech: null,
    stars: 3,
    input: { x: "", y: "", z: "" },
    kubiPos: ORIGIN,
    kubiPath: null,
    pathSeq: 0,
    collected: [],
    pending: null,
    shapes: [],
    selectedId: null,
    ruler: { origin: ORIGIN, mode: "edge" },
    rulerPicking: false,
    alignActive: false,
    alignPreview: null,
    shapeCounter: 0,
    showBlueprint: false,
    successSeq: 0,

    start: (missionId) => {
      const mission = missionById(missionId);
      if (!mission) return;
      const scene = mission.introFrom ? { ...mission.scene, ...mission.introFrom } : mission.scene;
      const isBuild = mission.type === "build";
      set({
        mission,
        phase: "intro",
        introStep: 0,
        scene,
        mistakes: 0,
        lastError: null,
        stars: 3,
        speech: say(mission.id === "1.1" ? "wave" : "talk", { key: mission.intro[0] ?? mission.goal }),
        input: { x: "", y: "", z: "" },
        kubiPos: isBuild ? mission.kubiSpot : ORIGIN,
        kubiPath: null,
        collected: pointTargets(mission).map(() => false),
        pending: null,
        shapes: isBuild ? [...mission.fixed, ...mission.editable] : [],
        selectedId: isBuild ? (mission.editable[0]?.id ?? null) : null,
        ruler: { origin: ORIGIN, mode: "edge" },
        rulerPicking: false,
        alignActive: false,
        alignPreview: null,
        shapeCounter: 0,
        showBlueprint: isBuild && mission.blueprint !== undefined,
      });
    },

    nextIntro: () => {
      const { mission, introStep } = get();
      if (!mission) return;
      const step = introStep + 1;
      if (step >= mission.intro.length) {
        set({
          phase: "play",
          introStep: step,
          scene: mission.scene,
          speech: say("point", { key: mission.goal }),
        });
        return;
      }
      const key = mission.intro[step];
      // Nach dem ersten Satz wechselt die Szene animiert in ihren Missionszustand (z. B. Kippen in 3D).
      if (key) set({ introStep: step, scene: mission.scene, speech: say("talk", { key }) });
    },

    skipIntro: () => {
      const { mission } = get();
      if (!mission) return;
      set({
        phase: "play",
        introStep: mission.intro.length,
        scene: mission.scene,
        speech: say("point", { key: mission.goal }),
      });
    },

    setInput: (axis, value) => set((s) => ({ input: { ...s.input, [axis]: value } })),

    submitPoint: () => {
      const { mission, input, phase, collected } = get();
      if (!mission || mission.type === "build" || phase !== "play") return;
      const dims = mission.scene.dims;
      const axes = (["x", "y", "z"] as const).slice(0, dims);
      const values = axes.map((a) => parseNumber(input[a]));
      if (values.some((v) => v === null)) {
        set({ speech: say("think", { key: "hint.emptyField" }) });
        return;
      }
      const [x = 0, y = 0, z = 0] = values as number[];
      const { min, max, zMax } = mission.scene;
      const outside = [x, y].slice(0, Math.min(dims, 2)).some((v) => v < min || v > max) || z < 0 || z > zMax;
      if (outside) {
        set({ speech: say("think", { key: "hint.outOfRange", params: { min, max } }) });
        return;
      }
      const point = vec(x, y, z);
      const targets = pointTargets(mission);
      let hit: number | null = null;
      let error: ErrorKind | null = null;
      if (mission.type === "read") {
        const i = currentReadIndex(collected);
        const target = targets[i];
        if (target) {
          error = diagnosePoint(point, target, dims);
          if (error === null) hit = i;
        }
      } else {
        const open = targets.filter((_, i) => !collected[i]);
        const found = targets.findIndex((t, i) => !collected[i] && equals(t, point));
        if (found >= 0) hit = found;
        else error = diagnoseAgainstAny(point, open, dims) ?? "generic";
      }
      const path: Vec3[] = [ORIGIN, vec(x, 0, 0), vec(x, y, 0), vec(x, y, z)];
      set((s) => ({
        phase: "moving",
        pending: { point, hit, error },
        kubiPath: path,
        pathSeq: s.pathSeq + 1,
        speech: null,
        lastError: null,
      }));
    },

    arrive: () => {
      const { mission, pending, collected } = get();
      if (!mission || !pending) return;
      set({ kubiPos: pending.point, kubiPath: null, pending: null });
      if (pending.hit === null) {
        registerMistake(pending.error ?? "generic");
        return;
      }
      const next = collected.map((c, i) => c || i === pending.hit);
      set({ collected: next });
      const left = next.filter((c) => !c).length;
      if (left === 0) {
        succeed();
        return;
      }
      const key: MessageKey = mission.type === "read" ? "help.nextItem" : "help.rightOne";
      set({
        phase: "play",
        speech: say("happy", { key, params: { n: left } }),
        input: { x: "", y: "", z: "" },
      });
    },

    showMe: () => {
      const { mission, collected, shapes, shapeCounter } = get();
      if (!mission) return;
      if (mission.type !== "build") {
        const targets = pointTargets(mission);
        const i = mission.type === "read" ? currentReadIndex(collected) : collected.findIndex((c) => !c);
        const t = targets[i];
        if (!t) return;
        set({
          input: { x: String(t.x), y: String(t.y), z: String(t.z) },
          speech: say("point", { key: "help.shown", keyParams: { button: "ui.go" } }),
        });
        return;
      }
      const left = buildTargetsLeft(mission, shapes);
      const target = left[0];
      if (!target) return;
      const matchedIds = new Set(
        shapes
          .filter((s) => !s.fixed && mission.targets.some((t) => t.kind === s.kind && sameBox(s, t)))
          .map((s) => s.id),
      );
      const candidate = shapes.find((s) => !s.fixed && s.kind === target.kind && !matchedIds.has(s.id));
      let nextShapes: Shape[];
      let id: string;
      let counter = shapeCounter;
      if (candidate) {
        id = candidate.id;
        nextShapes = shapes.map((s) => (s.id === id ? { ...s, pos: target.pos, size: target.size } : s));
      } else {
        counter += 1;
        id = `${target.kind}-${counter}`;
        nextShapes = [...shapes, { ...newShape(target.kind, id), pos: target.pos, size: target.size }];
      }
      set({
        shapes: nextShapes,
        selectedId: id,
        shapeCounter: counter,
        speech: say("point", { key: "help.shown", keyParams: { button: "ui.check" } }),
      });
    },

    select: (id) => set({ selectedId: id }),

    setField: (id, field, value) => {
      const { shapes, ruler } = get();
      set({
        shapes: shapes.map((s) => (s.id === id && !s.fixed ? applyField(s, field, value, ruler) : s)),
      });
    },

    addShape: (kind) => {
      const { shapeCounter, shapes, phase } = get();
      if (phase === "success") return;
      const counter = shapeCounter + 1;
      const id = `${kind}-${counter}`;
      set({ shapes: [...shapes, newShape(kind, id)], selectedId: id, shapeCounter: counter });
    },

    deleteSelected: () => {
      const { selectedId, shapes } = get();
      const target = shapes.find((s) => s.id === selectedId);
      if (!target || target.fixed) return;
      set({ shapes: shapes.filter((s) => s.id !== selectedId), selectedId: null });
    },

    toggleRulerMode: () =>
      set((s) => ({ ruler: { ...s.ruler, mode: s.ruler.mode === "edge" ? "center" : "edge" } })),

    toggleRulerPick: () => set((s) => ({ rulerPicking: !s.rulerPicking, alignActive: false })),

    placeRuler: (point) => set((s) => ({ ruler: { ...s.ruler, origin: point }, rulerPicking: false })),

    toggleAlign: () => set((s) => ({ alignActive: !s.alignActive, rulerPicking: false, alignPreview: null })),

    previewAlign: (alignPreview) => set({ alignPreview }),

    applyAlign: (axis, mode) => {
      const { mission, shapes, selectedId } = get();
      if (!mission || mission.type !== "build" || !mission.alignKeyId) return;
      const key = shapes.find((s) => s.id === mission.alignKeyId);
      const selected = shapes.find((s) => s.id === selectedId && !s.fixed);
      const moving = selected ?? shapes.find((s) => !s.fixed);
      if (!key || !moving) return;
      set({
        shapes: shapes.map((s) => (s.id === moving.id ? alignTo(s, key, axis, mode) : s)),
        selectedId: moving.id,
        alignPreview: null,
      });
    },

    toggleBlueprint: () => set((s) => ({ showBlueprint: !s.showBlueprint })),

    checkBuild: () => {
      const { mission, shapes, ruler, phase } = get();
      if (!mission || mission.type !== "build" || phase !== "play") return;
      const fixed = shapes.filter((s) => s.fixed);
      const alignKey = mission.alignKeyId ? fixed.find((s) => s.id === mission.alignKeyId) : undefined;
      const result = evaluateBuild(shapes, mission.targets, {
        dims: mission.scene.dims === 2 ? 2 : 3,
        fixed,
        rulerOrigin: ruler.origin,
        ...(mission.expectedOrigin ? { expectedOrigin: mission.expectedOrigin } : {}),
        ...(alignKey ? { alignKey } : {}),
      });
      if (result.ok) {
        succeed();
        return;
      }
      registerMistake(result.error ?? "generic", result.shapeId ? { selectedId: result.shapeId } : {});
    },
  };
});
