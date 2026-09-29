import type { Unit, Vec3 } from "@/domain/coords";
import type { Dims, ErrorKind } from "@/domain/evaluate";
import type { Field, Shape, ShapeKind, TargetShape } from "@/domain/geometry";
import type { MessageKey } from "@/i18n";

export type ChapterId = 1 | 2 | 3 | 4 | 5;
export type CameraPreset = "line" | "top" | "iso";
export type ItemKind = "crystal" | "treasure" | "star" | "balloon";

export interface SceneConfig {
  dims: Dims;
  unit: Unit;
  /** Sichtbarer Bereich der Achsen x (und y) in Missionseinheiten. */
  min: number;
  max: number;
  zMax: number;
  camera: CameraPreset;
  /** Lineal-Symbol am Nullpunkt (ab Kapitel 4). */
  ruler: boolean;
  /** Halbe Breite des Bereichs, den die Kamera zeigen soll (Missionseinheiten). Standard: max. */
  frame?: number;
}

export interface Tools {
  viewCube: boolean;
  orbit: boolean;
  shapes: Exclude<ShapeKind, "plate">[];
  rulerMove: boolean;
  rulerToggle: boolean;
  align: boolean;
  /** Zahlenfelder direkt an der Form wie in Tinkercad; sonst Steuerpult unten. */
  onObject: boolean;
}

interface MissionBase {
  id: string;
  chapter: ChapterId;
  title: MessageKey;
  goal: MessageKey;
  intro: MessageKey[];
  success: MessageKey;
  scene: SceneConfig;
  /** Szene zu Beginn der Einführung; nach dem ersten Satz wechselt sie animiert zu `scene`. */
  introFrom?: Partial<SceneConfig>;
  tools: Tools;
  /** Missionsspezifische Hinweise; sonst gelten die allgemeinen (hint.*). */
  hints?: Partial<Record<ErrorKind, MessageKey>>;
}

export interface GotoMission extends MissionBase {
  type: "goto";
  targets: Vec3[];
  item: ItemKind;
}

export interface ReadMission extends MissionBase {
  type: "read";
  items: { pos: Vec3; kind: ItemKind }[];
}

export interface BuildMission extends MissionBase {
  type: "build";
  fixed: Shape[];
  editable: Shape[];
  targets: TargetShape[];
  /** Geisterbild des Ziels: immer sichtbar oder nur als Hilfe nach zwei Fehlversuchen. */
  ghost: "always" | "help";
  ghostStyle: "plain" | "dice" | "soil";
  /** Markierungen, z. B. das Kreuz in der Mitte der Platte. */
  markers?: Vec3[];
  fields: Field[];
  /** Nullpunkt, von dem aus die Aufgabe gemeint ist (für den Hinweis „falscher Nullpunkt“). */
  expectedOrigin?: Vec3;
  /** Punkte, an die man das Lineal legen kann. */
  rulerSpots?: Vec3[];
  alignKeyId?: string;
  blueprint?: "bench";
  /** Standplatz von Kubi als Zuschauer. */
  kubiSpot: Vec3;
}

export type Mission = GotoMission | ReadMission | BuildMission;

export interface Chapter {
  id: ChapterId;
  title: MessageKey;
  tinkercad: MessageKey[];
}
