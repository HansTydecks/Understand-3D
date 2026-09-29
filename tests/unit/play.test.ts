import { beforeEach, describe, expect, it } from "vitest";

import { usePlay } from "@/app/play";
import { useSettings } from "@/app/settings";

const play = () => usePlay.getState();

describe("Spielablauf", () => {
  beforeEach(() => {
    useSettings.getState().reset();
  });

  it("führt durch Einführung, Fehlversuch und Erfolg (Mission 1.2)", () => {
    play().start("1.2");
    expect(play().phase).toBe("intro");
    // Szene startet im Zustand von 1.1 und wechselt nach dem ersten Satz.
    expect(play().scene.min).toBe(0);
    play().nextIntro();
    expect(play().scene.min).toBe(-8);
    play().skipIntro();
    expect(play().phase).toBe("play");

    play().setInput("x", "4");
    play().submitPoint();
    expect(play().phase).toBe("moving");
    play().arrive();
    expect(play().mistakes).toBe(1);
    expect(play().lastError).toBe("sign");
    expect(play().speech?.lines[0]?.key).toBe("hint.sign");

    play().setInput("x", "-4");
    play().submitPoint();
    play().arrive();
    expect(play().phase).toBe("success");
    expect(play().stars).toBe(2);
    expect(useSettings.getState().progress["1.2"]).toBe(2);
  });

  it("zählt leere oder zu große Eingaben nicht als Fehler", () => {
    play().start("2.1");
    play().skipIntro();
    play().setInput("x", "3");
    play().submitPoint();
    expect(play().speech?.lines[0]?.key).toBe("hint.emptyField");
    play().setInput("y", "40");
    play().submitPoint();
    expect(play().speech?.lines[0]?.key).toBe("hint.outOfRange");
    expect(play().mistakes).toBe(0);
  });

  it("bietet nach drei Fehlversuchen „Zeig's mir“ an und trägt die Lösung ein", () => {
    play().start("2.1");
    play().skipIntro();
    for (let i = 0; i < 3; i++) {
      play().setInput("x", "1");
      play().setInput("y", "1");
      play().submitPoint();
      play().arrive();
    }
    expect(play().mistakes).toBe(3);
    play().showMe();
    expect(play().input).toMatchObject({ x: "3", y: "4" });
  });

  it("sammelt mehrere Ziele in beliebiger Reihenfolge (Mission 2.3)", () => {
    play().start("2.3");
    play().skipIntro();
    for (const [x, y] of [
      ["-3", "-2"],
      ["-4", "3"],
      ["2", "-5"],
    ] as const) {
      play().setInput("x", x);
      play().setInput("y", y);
      play().submitPoint();
      play().arrive();
    }
    expect(play().collected).toEqual([true, true, true]);
    expect(play().phase).toBe("success");
  });

  it("stapelt Kisten über die Zahlenfelder (Mission 4.2)", () => {
    play().start("4.2");
    play().skipIntro();
    play().setField("top", "x", -20);
    play().setField("top", "y", -10);
    play().checkBuild();
    expect(play().lastError).toBe("inside");
    play().setField("top", "z", 10);
    play().checkBuild();
    expect(play().phase).toBe("success");
  });

  it("misst nach dem Umsetzen des Lineals relativ (Mission 5.1)", () => {
    play().start("5.1");
    play().skipIntro();
    play().placeRuler({ x: -40, y: -30, z: 0 });
    play().setField("lamp", "x", 10);
    play().setField("lamp", "y", 10);
    play().setField("lamp", "z", 30);
    play().checkBuild();
    expect(play().phase).toBe("success");
  });

  it("richtet mit dem Werkzeug aus (Mission 5.2)", () => {
    play().start("5.2");
    play().skipIntro();
    play().toggleAlign();
    play().applyAlign("x", "min");
    play().applyAlign("y", "mid");
    play().checkBuild();
    expect(play().lastError).toBe("alignMin");
    play().applyAlign("x", "mid");
    play().checkBuild();
    expect(play().phase).toBe("success");
  });

  it("baut das Meisterstück aus neuen Formen (Mission 5.3)", () => {
    play().start("5.3");
    play().skipIntro();
    play().addShape("box");
    const leg = play().selectedId ?? "";
    for (const [f, v] of [
      ["w", 5],
      ["d", 20],
      ["h", 20],
      ["x", 25],
      ["y", -10],
    ] as const)
      play().setField(leg, f, v);
    play().checkBuild();
    expect(play().lastError).toBe("missingShape");
    play().addShape("box");
    const seat = play().selectedId ?? "";
    for (const [f, v] of [
      ["w", 60],
      ["d", 20],
      ["h", 5],
      ["x", -30],
      ["y", -10],
      ["z", 20],
    ] as const)
      play().setField(seat, f, v);
    play().checkBuild();
    expect(play().phase).toBe("success");
  });
});
