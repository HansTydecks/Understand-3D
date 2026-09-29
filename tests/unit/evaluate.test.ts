import { describe, expect, it } from "vitest";

import { vec } from "@/domain/coords";
import { diagnoseAgainstAny, diagnosePoint, evaluateBuild, starsFor } from "@/domain/evaluate";
import type { Shape } from "@/domain/geometry";

const box = (
  id: string,
  pos: [number, number, number],
  size: [number, number, number],
  fixed = false,
): Shape => ({
  id,
  kind: "box",
  pos: vec(...pos),
  size: vec(...size),
  color: "#000",
  fixed,
});

describe("diagnosePoint", () => {
  it("erkennt richtige Punkte", () => {
    expect(diagnosePoint(vec(3, 4), vec(3, 4), 2)).toBeNull();
    expect(diagnosePoint(vec(-4), vec(-4), 1)).toBeNull();
  });

  it("erkennt vertauschte Koordinaten", () => {
    expect(diagnosePoint(vec(4, 3), vec(3, 4), 2)).toBe("swapXY");
  });

  it("vertauscht nicht, wenn x und y gleich sind", () => {
    expect(diagnosePoint(vec(3, 3), vec(3, 3), 2)).toBeNull();
  });

  it("erkennt falsche Vorzeichen", () => {
    expect(diagnosePoint(vec(4), vec(-4), 1)).toBe("sign");
    expect(diagnosePoint(vec(-2, -5), vec(2, -5), 2)).toBe("sign");
  });

  it("erkennt eins daneben", () => {
    expect(diagnosePoint(vec(5), vec(6), 1)).toBe("offByOne");
    expect(diagnosePoint(vec(3, 5), vec(3, 4), 2)).toBe("offByOne");
  });

  it("erkennt vergessenes z und vertauschte Achsen im Raum", () => {
    expect(diagnosePoint(vec(2, 3, 0), vec(2, 3, 4), 3)).toBe("forgotZ");
    expect(diagnosePoint(vec(4, 3, 2), vec(2, 3, 4), 3)).toBe("axisMixup");
  });

  it("fällt sonst auf den allgemeinen Hinweis zurück", () => {
    expect(diagnosePoint(vec(7, 1), vec(3, 4), 2)).toBe("generic");
  });

  it("wählt bei mehreren Zielen den aussagekräftigsten Befund", () => {
    expect(diagnoseAgainstAny(vec(3, -4), [vec(2, -5), vec(-4, 3)], 2)).toBe("swapXY");
    expect(diagnoseAgainstAny(vec(-4, 3), [vec(-4, 3)], 2)).toBeNull();
  });
});

describe("evaluateBuild", () => {
  const base = box("base", [-20, -10, 0], [40, 20, 10], true);
  const target = { kind: "box" as const, pos: vec(-20, -10, 10), size: vec(20, 20, 10) };
  const ctx = { dims: 3 as const, fixed: [base], rulerOrigin: vec() };

  it("akzeptiert die richtige Form", () => {
    expect(evaluateBuild([base, box("top", [-20, -10, 10], [20, 20, 10])], [target], ctx)).toMatchObject({
      ok: true,
    });
  });

  it("erkennt „steckt drin“ und „schwebt“", () => {
    expect(evaluateBuild([base, box("top", [-20, -10, 0], [20, 20, 10])], [target], ctx).error).toBe(
      "inside",
    );
    expect(evaluateBuild([base, box("top", [-20, -10, 20], [20, 20, 10])], [target], ctx).error).toBe(
      "floating",
    );
  });

  it("erkennt vertauschte Breite und Tiefe", () => {
    const t = { kind: "box" as const, pos: vec(-2, 1, 0), size: vec(5, 3, 0) };
    const result = evaluateBuild([box("p", [-2, 1, 0], [3, 5, 0])], [t], { ...ctx, fixed: [] });
    expect(result.error).toBe("sizeSwapped");
  });

  it("erkennt Mitte statt Ecke", () => {
    const t = { kind: "box" as const, pos: vec(25, 15, 10), size: vec(10, 10, 20) };
    const result = evaluateBuild([box("c", [30, 20, 10], [10, 10, 20])], [t], { ...ctx, fixed: [] });
    expect(result.error).toBe("cornerCenter");
  });

  it("erkennt den falschen Nullpunkt beim Lineal", () => {
    const t = { kind: "box" as const, pos: vec(-30, -20, 30), size: vec(10, 10, 15) };
    const result = evaluateBuild([box("lamp", [10, 10, 30], [10, 10, 15])], [t], {
      ...ctx,
      fixed: [],
      expectedOrigin: vec(-40, -30, 0),
    });
    expect(result.error).toBe("wrongOrigin");
  });

  it("erkennt beim Ausrichten eine Kante statt der Mitte", () => {
    const wall = box("wall", [-30, -10, 0], [60, 20, 20], true);
    const t = { kind: "box" as const, pos: vec(-8, -8, 0), size: vec(16, 16, 40) };
    const result = evaluateBuild([wall, box("tower", [-30, -8, 0], [16, 16, 40])], [t], {
      ...ctx,
      fixed: [wall],
      alignKey: wall,
    });
    expect(result.error).toBe("alignMin");
  });

  it("meldet fehlende und überzählige Formen", () => {
    const t2 = { kind: "box" as const, pos: vec(0, 0, 0), size: vec(5, 5, 5) };
    expect(evaluateBuild([], [t2], ctx).error).toBe("missingShape");
    expect(
      evaluateBuild([box("a", [0, 0, 0], [5, 5, 5]), box("b", [9, 9, 0], [5, 5, 5])], [t2], ctx).error,
    ).toBe("extraShape");
  });

  it("ist unabhängig von der Reihenfolge der Formen", () => {
    const t1 = { kind: "box" as const, pos: vec(25, -10, 0), size: vec(5, 20, 20) };
    const t2 = { kind: "box" as const, pos: vec(-30, -10, 20), size: vec(60, 20, 5) };
    const shapes = [box("seat", [-30, -10, 20], [60, 20, 5]), box("leg", [25, -10, 0], [5, 20, 20])];
    expect(evaluateBuild(shapes, [t1, t2], ctx)).toMatchObject({ ok: true, matched: 2 });
  });
});

describe("starsFor", () => {
  it("vergibt 3, 2 und 1 Stern", () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(1)).toBe(2);
    expect(starsFor(5)).toBe(1);
  });
});
