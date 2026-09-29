import { AXES, type Vec3, equals, near, sub, vec } from "./coords";
import { type Shape, type TargetShape, center, maxCorner, overlaps, sameBox } from "./geometry";

/**
 * Typische Denkfehler, die Kubi gezielt anspricht. Die Auswertung ist eine reine Funktion und damit
 * vollständig testbar; die Oberfläche übersetzt die Art in einen kindgerechten Hinweis.
 */
export type ErrorKind =
  | "swapXY"
  | "sign"
  | "offByOne"
  | "forgotZ"
  | "axisMixup"
  | "cornerCenter"
  | "centerCorner"
  | "sizeSwapped"
  | "wrongSize"
  | "inside"
  | "floating"
  | "wrongOrigin"
  | "alignMin"
  | "alignMax"
  | "missingShape"
  | "extraShape"
  | "wrongPosition"
  | "generic";

export type Dims = 1 | 2 | 3;

/** Prüft einen Punkt. null bedeutet: richtig. */
export function diagnosePoint(given: Vec3, target: Vec3, dims: Dims): ErrorKind | null {
  if (equals(given, target)) return null;
  const axes = AXES.slice(0, dims);

  if (
    dims >= 2 &&
    !near(target.x, target.y) &&
    near(given.x, target.y) &&
    near(given.y, target.x) &&
    near(given.z, target.z)
  ) {
    return "swapXY";
  }
  if (dims === 3 && near(given.x, target.x) && near(given.y, target.y) && near(given.z, 0)) {
    return "forgotZ";
  }
  if (dims === 3) {
    const sortedGiven = [given.x, given.y, given.z].sort((a, b) => a - b);
    const sortedTarget = [target.x, target.y, target.z].sort((a, b) => a - b);
    if (sortedGiven.every((v, i) => near(v, sortedTarget[i] ?? Number.NaN))) return "axisMixup";
  }
  const signOnly = axes.every((a) => near(given[a], target[a]) || near(given[a], -target[a]));
  if (signOnly) return "sign";

  const diffs = axes.map((a) => Math.abs(given[a] - target[a]));
  if (diffs.every((d) => d <= 1 + 1e-6) && diffs.filter((d) => d > 1e-6).length === 1) return "offByOne";

  return "generic";
}

/** Bei mehreren Zielen wird der aussagekräftigste Befund zum passendsten Ziel gewählt. */
export function diagnoseAgainstAny(given: Vec3, targets: Vec3[], dims: Dims): ErrorKind | null {
  let fallback: ErrorKind = "generic";
  for (const t of targets) {
    const d = diagnosePoint(given, t, dims);
    if (d === null) return null;
    if (d !== "generic") return d;
    fallback = d;
  }
  return fallback;
}

export interface BuildContext {
  dims: 2 | 3;
  fixed: Shape[];
  /** Aktueller Nullpunkt des Lineals. */
  rulerOrigin: Vec3;
  /** Nullpunkt, von dem aus die Aufgabe gemeint ist (Mission „Lineal umsetzen“). */
  expectedOrigin?: Vec3;
  /** Bezugsobjekt beim Ausrichten. */
  alignKey?: Shape;
}

export interface BuildResult {
  ok: boolean;
  error?: ErrorKind;
  /** Körper, auf den sich der Hinweis bezieht. */
  shapeId?: string;
  /** Anzahl der bereits passenden Ziele. */
  matched: number;
}

const distance = (a: Shape, t: TargetShape): number => {
  const dp = sub(a.pos, t.pos);
  const ds = sub(a.size, t.size);
  return Math.abs(dp.x) + Math.abs(dp.y) + Math.abs(dp.z) + Math.abs(ds.x) + Math.abs(ds.y) + Math.abs(ds.z);
};

/** Ordnet Körper den Zielen zu (Reihenfolge egal) und benennt den ersten Fehler. */
export function evaluateBuild(shapes: Shape[], targets: TargetShape[], ctx: BuildContext): BuildResult {
  const free = shapes.filter((s) => !s.fixed);
  const unmatchedShapes = [...free];
  const unmatchedTargets: TargetShape[] = [];
  for (const t of targets) {
    const i = unmatchedShapes.findIndex((s) => s.kind === t.kind && sameBox(s, t));
    if (i >= 0) unmatchedShapes.splice(i, 1);
    else unmatchedTargets.push(t);
  }
  const matched = targets.length - unmatchedTargets.length;
  const firstTarget = unmatchedTargets[0];
  if (!firstTarget) {
    const extra = unmatchedShapes[0];
    return extra ? { ok: false, error: "extraShape", shapeId: extra.id, matched } : { ok: true, matched };
  }
  const candidates = unmatchedShapes.filter((s) => s.kind === firstTarget.kind);
  const candidate = candidates.sort((a, b) => distance(a, firstTarget) - distance(b, firstTarget))[0];
  if (!candidate) return { ok: false, error: "missingShape", matched };
  return { ok: false, error: diagnoseShape(candidate, firstTarget, ctx), shapeId: candidate.id, matched };
}

export function diagnoseShape(s: Shape, t: TargetShape, ctx: BuildContext): ErrorKind {
  if (!equals(s.size, t.size)) {
    if (near(s.size.x, t.size.y) && near(s.size.y, t.size.x) && near(s.size.z, t.size.z))
      return "sizeSwapped";
    return "wrongSize";
  }
  const xyOk = near(s.pos.x, t.pos.x) && near(s.pos.y, t.pos.y);
  if (!xyOk) {
    const tc = center(t);
    if (near(s.pos.x, tc.x) && near(s.pos.y, tc.y)) return "cornerCenter";
    if (near(s.pos.x, t.pos.x - t.size.x / 2) && near(s.pos.y, t.pos.y - t.size.y / 2)) return "centerCorner";
    if (ctx.expectedOrigin) {
      const rel = sub(t.pos, ctx.expectedOrigin);
      const given = sub(s.pos, ctx.rulerOrigin);
      if (near(given.x, rel.x) && near(given.y, rel.y)) return "wrongOrigin";
    }
    if (ctx.alignKey) {
      const key = ctx.alignKey;
      const km = maxCorner(key);
      const sm = maxCorner(s);
      const minHit = near(s.pos.x, key.pos.x) || near(s.pos.y, key.pos.y);
      const maxHit = near(sm.x, km.x) || near(sm.y, km.y);
      if (minHit) return "alignMin";
      if (maxHit) return "alignMax";
    }
    const point = diagnosePoint(vec(s.pos.x, s.pos.y, 0), vec(t.pos.x, t.pos.y, 0), 2);
    if (point === "swapXY" || point === "sign" || point === "offByOne") return point;
    return "wrongPosition";
  }
  if (!near(s.pos.z, t.pos.z)) {
    if (s.pos.z > t.pos.z) return "floating";
    if (ctx.fixed.some((f) => overlaps(f, s))) return "inside";
    return near(s.pos.z, 0) ? "forgotZ" : "wrongPosition";
  }
  return "generic";
}

/** Sterne wie im Spiel: erster Versuch 3, zweiter 2, danach 1. */
export const starsFor = (mistakes: number): 1 | 2 | 3 => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1);
