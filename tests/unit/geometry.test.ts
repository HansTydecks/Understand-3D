import { describe, expect, it } from "vitest";

import { toScene, vec } from "@/domain/coords";
import { type Ruler, type Shape, alignTo, applyField, displayValue, overlaps } from "@/domain/geometry";

const shape: Shape = { id: "s", kind: "box", pos: vec(10, 20, 5), size: vec(20, 10, 8), color: "#000" };
const edge: Ruler = { origin: vec(), mode: "edge" };
const center: Ruler = { origin: vec(), mode: "center" };

describe("Koordinatenumrechnung", () => {
  it("setzt z nach oben (Tinkercad) in y nach oben (three.js) um", () => {
    expect(toScene(vec(1, 2, 3), "cell")).toEqual([1, 3, -2]);
    expect(toScene(vec(10, 20, 30), "mm")).toEqual([1, 3, -2]);
  });
});

describe("Lineal: Anzeige und Eingabe", () => {
  it("misst zur Kante oder zur Mitte, z immer ab der Arbeitsebene", () => {
    expect(displayValue(shape, "x", edge)).toBe(10);
    expect(displayValue(shape, "x", center)).toBe(20);
    expect(displayValue(shape, "y", center)).toBe(25);
    expect(displayValue(shape, "z", center)).toBe(5);
    expect(displayValue(shape, "w", center)).toBe(20);
  });

  it("zählt relativ zum verschobenen Lineal", () => {
    const ruler: Ruler = { origin: vec(-40, -30, 0), mode: "edge" };
    expect(displayValue(shape, "x", ruler)).toBe(50);
    const moved = applyField(shape, "x", 10, ruler);
    expect(moved.pos.x).toBe(-30);
  });

  it("Eingabe und Anzeige passen in beiden Modi zusammen", () => {
    for (const ruler of [edge, center]) {
      const next = applyField(shape, "y", 7, ruler);
      expect(displayValue(next, "y", ruler)).toBe(7);
    }
  });

  it("hält beim Ändern der Maße die Ecke fest und erlaubt keine Maße unter 1", () => {
    const wider = applyField(shape, "w", 40, edge);
    expect(wider.pos).toEqual(shape.pos);
    expect(applyField(shape, "h", 0, edge).size.z).toBe(1);
  });
});

describe("Ausrichten und Überschneidung", () => {
  const wall: Shape = { id: "w", kind: "box", pos: vec(-30, -10, 0), size: vec(60, 20, 20), color: "#000" };
  const tower: Shape = {
    id: "t",
    kind: "cylinder",
    pos: vec(30, -50, 0),
    size: vec(16, 16, 40),
    color: "#000",
  };

  it("richtet an Kante oder Mitte des Bezugs aus", () => {
    expect(alignTo(tower, wall, "x", "mid").pos.x).toBe(-8);
    expect(alignTo(tower, wall, "y", "mid").pos.y).toBe(-8);
    expect(alignTo(tower, wall, "x", "min").pos.x).toBe(-30);
    expect(alignTo(tower, wall, "x", "max").pos.x).toBe(14);
  });

  it("erkennt echte Überschneidungen, aber nicht bloßes Berühren", () => {
    const top: Shape = { ...wall, id: "top", pos: vec(-30, -10, 20) };
    expect(overlaps(wall, top)).toBe(false);
    expect(overlaps(wall, { ...top, pos: vec(-30, -10, 10) })).toBe(true);
  });
});
