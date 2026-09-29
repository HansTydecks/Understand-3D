import { describe, expect, it } from "vitest";

import { allKeys, dictionary, translate } from "@/i18n";
import { formatInput, formatNumber, formatPoint, parseNumber } from "@/i18n/format";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("Übersetzungen", () => {
  it("haben in beiden Sprachen dieselben Schlüssel und keine leeren Texte", () => {
    const de = dictionary("de");
    const en = dictionary("en");
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const key of allKeys()) {
      expect(de[key].trim(), key).not.toBe("");
      expect(en[key].trim(), key).not.toBe("");
    }
  });

  it("verwenden in beiden Sprachen dieselben Platzhalter", () => {
    for (const key of allKeys()) {
      expect(placeholders(dictionary("en")[key]), key).toEqual(placeholders(dictionary("de")[key]));
    }
  });

  it("setzt Platzhalter ein", () => {
    expect(translate("de", "ui.found", { n: 1, total: 3 })).toBe("1 von 3");
    expect(translate("en", "ui.found", { n: 1, total: 3 })).toBe("1 of 3");
  });

  it("nutzt die Koordinaten-Schreibweise der jeweiligen Sprache in den Aufträgen", () => {
    expect(translate("de", "m2.1.goal")).toContain("(3 | 4)");
    expect(translate("en", "m2.1.goal")).toContain("(3, 4)");
  });
});

describe("Zahlenformat", () => {
  it("schreibt Punkte wie in der Schule", () => {
    expect(formatPoint([3, -4], "de")).toBe("(3 | −4)");
    expect(formatPoint([3, -4, 2.5], "en")).toBe("(3, −4, 2.5)");
    expect(formatNumber(2.5, "de")).toBe("2,5");
    expect(formatInput(-4, "de")).toBe("-4");
  });

  it("liest Komma, Punkt und verschiedene Minuszeichen", () => {
    expect(parseNumber("2,5")).toBe(2.5);
    expect(parseNumber(" −4 ")).toBe(-4);
    expect(parseNumber("-4")).toBe(-4);
    expect(parseNumber("+3")).toBe(3);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1-2")).toBeNull();
  });
});
