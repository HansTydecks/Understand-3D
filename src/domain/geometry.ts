import { type Axis, type Vec3, near, vec } from "./coords";

export type ShapeKind = "box" | "cylinder" | "plate";

/** Ein Körper wird wie in Tinkercad über seinen umschließenden Quader beschrieben. */
export interface Shape {
  id: string;
  kind: ShapeKind;
  /** Ecke mit den kleinsten Werten (links, vorne, unten). */
  pos: Vec3;
  /** Breite (x), Tiefe (y), Höhe (z). */
  size: Vec3;
  color: string;
  fixed?: boolean;
}

export interface TargetShape {
  kind: ShapeKind;
  pos: Vec3;
  size: Vec3;
}

/** Eingabefelder: Position x/y/z und Maße w (Breite), d (Tiefe), h (Höhe). */
export type Field = "x" | "y" | "z" | "w" | "d" | "h";
export const SIZE_AXIS: Record<"w" | "d" | "h", Axis> = { w: "x", d: "y", h: "z" };

/** Lineal wie in Tinkercad: Nullpunkt auf der Arbeitsebene, Messung zur Kante oder zur Mitte. */
export type RulerMode = "edge" | "center";
export interface Ruler {
  origin: Vec3;
  mode: RulerMode;
}

export const center = (s: { pos: Vec3; size: Vec3 }): Vec3 =>
  vec(s.pos.x + s.size.x / 2, s.pos.y + s.size.y / 2, s.pos.z + s.size.z / 2);

export const maxCorner = (s: { pos: Vec3; size: Vec3 }): Vec3 =>
  vec(s.pos.x + s.size.x, s.pos.y + s.size.y, s.pos.z + s.size.z);

/** Echte Überschneidung (Berühren zählt nicht). */
export function overlaps(a: { pos: Vec3; size: Vec3 }, b: { pos: Vec3; size: Vec3 }): boolean {
  const am = maxCorner(a);
  const bm = maxCorner(b);
  const axisOverlap = (a0: number, a1: number, b0: number, b1: number) =>
    Math.min(a1, b1) - Math.max(a0, b0) > 1e-6;
  return (
    axisOverlap(a.pos.x, am.x, b.pos.x, bm.x) &&
    axisOverlap(a.pos.y, am.y, b.pos.y, bm.y) &&
    axisOverlap(a.pos.z, am.z, b.pos.z, bm.z)
  );
}

/** Bezugspunkt, den das Lineal misst: Ecke oder (für x/y) Mitte. z ist immer die Höhe über der Arbeitsebene. */
export function referencePoint(s: { pos: Vec3; size: Vec3 }, mode: RulerMode): Vec3 {
  if (mode === "edge") return s.pos;
  const c = center(s);
  return vec(c.x, c.y, s.pos.z);
}

/** Wert, der im Feld angezeigt wird (relativ zum Lineal). */
export function displayValue(s: Shape, field: Field, ruler: Ruler): number {
  if (field === "w" || field === "d" || field === "h") return s.size[SIZE_AXIS[field]];
  const ref = referencePoint(s, ruler.mode);
  return round2(ref[field] - ruler.origin[field]);
}

/** Setzt einen Feldwert und liefert den neuen Körper. Maße bleiben ≥ 1, die Ecke bleibt beim Ändern der Maße fest. */
export function applyField(s: Shape, field: Field, value: number, ruler: Ruler): Shape {
  if (field === "w" || field === "d" || field === "h") {
    const axis = SIZE_AXIS[field];
    const size = { ...s.size, [axis]: Math.max(1, round2(value)) };
    return { ...s, size };
  }
  const absolute = value + ruler.origin[field];
  const offset = ruler.mode === "center" && field !== "z" ? s.size[field] / 2 : 0;
  const pos = { ...s.pos, [field]: round2(absolute - offset) };
  return { ...s, pos };
}

export type AlignMode = "min" | "mid" | "max";

/** Ausrichten wie in Tinkercad mit Bezugsobjekt: Die Kante oder Mitte des Körpers wird der des Bezugs gleich. */
export function alignTo(s: Shape, key: { pos: Vec3; size: Vec3 }, axis: Axis, mode: AlignMode): Shape {
  let value: number;
  if (mode === "min") value = key.pos[axis];
  else if (mode === "max") value = key.pos[axis] + key.size[axis] - s.size[axis];
  else value = key.pos[axis] + key.size[axis] / 2 - s.size[axis] / 2;
  return { ...s, pos: { ...s.pos, [axis]: round2(value) } };
}

export const sameBox = (a: { pos: Vec3; size: Vec3 }, b: { pos: Vec3; size: Vec3 }): boolean =>
  near(a.pos.x, b.pos.x) &&
  near(a.pos.y, b.pos.y) &&
  near(a.pos.z, b.pos.z) &&
  near(a.size.x, b.size.x) &&
  near(a.size.y, b.size.y) &&
  near(a.size.z, b.size.z);

export const round2 = (n: number): number => Math.round(n * 100) / 100;
