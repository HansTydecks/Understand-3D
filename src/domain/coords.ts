/**
 * Koordinaten im Fachkern folgen der Tinkercad-Konvention: x nach rechts, y nach hinten (vom Betrachter weg),
 * z nach oben. three.js verwendet y nach oben – umgerechnet wird ausschließlich hier (toScene).
 */
export type Axis = "x" | "y" | "z";
export const AXES: readonly Axis[] = ["x", "y", "z"];

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const ORIGIN: Vec3 = Object.freeze(vec());

export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a: Vec3, f: number): Vec3 => vec(a.x * f, a.y * f, a.z * f);

const EPS = 1e-6;
export const near = (a: number, b: number): boolean => Math.abs(a - b) < EPS;
export const equals = (a: Vec3, b: Vec3): boolean => near(a.x, b.x) && near(a.y, b.y) && near(a.z, b.z);

/** Einheit einer Mission: „Kästchen“ (Kapitel 1–3) oder Millimeter wie in Tinkercad (ab Kapitel 4). */
export type Unit = "cell" | "mm";

/** Szeneneinheiten pro Fachkern-Einheit. Ein Rasterkästchen ist immer eine Szeneneinheit (= 10 mm). */
export const unitScale = (unit: Unit): number => (unit === "mm" ? 0.1 : 1);

/** Fachkern (z oben) → three.js (y oben). Der Betrachter blickt in der Startansicht entlang +y. */
export function toScene(v: Vec3, unit: Unit): [number, number, number] {
  const s = unitScale(unit);
  return [v.x * s, v.z * s, -v.y * s];
}

/** Rundet auf das Raster (Standard 1 Einheit wie „Raster ausrichten 1,0 mm“ in Tinkercad). */
export const snap = (value: number, step = 1): number => Math.round(value / step) * step;
