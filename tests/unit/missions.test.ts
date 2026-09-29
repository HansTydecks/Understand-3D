import { describe, expect, it } from "vitest";

import { diagnosePoint, evaluateBuild } from "@/domain/evaluate";
import { dictionary } from "@/i18n";
import { CHAPTERS, MISSIONS } from "@/missions/data";

describe("Missionen", () => {
  it("sind 16 Stück mit eindeutigen IDs in Kapitelreihenfolge", () => {
    expect(MISSIONS).toHaveLength(16);
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(16);
    const chapters = MISSIONS.map((m) => m.chapter);
    expect([...chapters].sort()).toEqual(chapters);
    expect(CHAPTERS.map((c) => c.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it("verweisen nur auf vorhandene Texte", () => {
    const de = dictionary("de");
    for (const m of MISSIONS) {
      for (const key of [m.title, m.goal, m.success, ...m.intro])
        expect(de[key], `${m.id}: ${key}`).toBeTruthy();
    }
  });

  it("haben Ziele innerhalb des sichtbaren Bereichs", () => {
    for (const m of MISSIONS) {
      if (m.type === "build") continue;
      const points = m.type === "goto" ? m.targets : m.items.map((i) => i.pos);
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(m.scene.min);
        expect(p.x).toBeLessThanOrEqual(m.scene.max);
        expect(p.y).toBeGreaterThanOrEqual(m.scene.dims >= 2 ? m.scene.min : 0);
        expect(p.z).toBeLessThanOrEqual(m.scene.zMax);
      }
    }
  });

  it("sind mit ihrer eigenen Lösung lösbar", () => {
    for (const m of MISSIONS) {
      if (m.type === "goto") {
        for (const t of m.targets) expect(diagnosePoint(t, t, m.scene.dims)).toBeNull();
      } else if (m.type === "read") {
        for (const i of m.items) expect(diagnosePoint(i.pos, i.pos, m.scene.dims)).toBeNull();
      } else {
        const solved = [
          ...m.fixed,
          ...m.targets.map((t, i) => ({
            id: `t${i}`,
            kind: t.kind,
            pos: t.pos,
            size: t.size,
            color: "#000",
          })),
        ];
        const result = evaluateBuild(solved, m.targets, {
          dims: m.scene.dims === 2 ? 2 : 3,
          fixed: m.fixed,
          rulerOrigin: { x: 0, y: 0, z: 0 },
        });
        expect(result.ok, m.id).toBe(true);
      }
    }
  });

  it("stellen die Startformen nicht schon richtig hin", () => {
    for (const m of MISSIONS) {
      if (m.type !== "build") continue;
      const result = evaluateBuild([...m.fixed, ...m.editable], m.targets, {
        dims: m.scene.dims === 2 ? 2 : 3,
        fixed: m.fixed,
        rulerOrigin: { x: 0, y: 0, z: 0 },
      });
      expect(result.ok, m.id).toBe(false);
    }
  });
});
