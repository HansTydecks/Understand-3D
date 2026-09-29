export type Lang = "de" | "en";

const plain = (n: number): string => {
  const rounded = Math.round(Math.abs(n) * 100) / 100;
  return String(rounded);
};

/** Anzeige in Texten: typografisches Minus, Dezimalkomma im Deutschen. */
export function formatNumber(n: number, lang: Lang): string {
  const body = lang === "de" ? plain(n).replace(".", ",") : plain(n);
  return (n < 0 && Math.abs(n) >= 0.005 ? "−" : "") + body;
}

/** Punkt in Schulschreibweise: DE (3 | 4 | 2), EN (3, 4, 2). */
export function formatPoint(values: readonly number[], lang: Lang): string {
  return `(${values.map((v) => formatNumber(v, lang)).join(lang === "de" ? " | " : ", ")})`;
}

/** Wert für Eingabefelder: normales Minus zum Weitertippen, Dezimalkomma im Deutschen. */
export function formatInput(n: number, lang: Lang): string {
  const body = lang === "de" ? plain(n).replace(".", ",") : plain(n);
  return (n < 0 && Math.abs(n) >= 0.005 ? "-" : "") + body;
}

/** Nimmt Komma oder Punkt, Bindestrich oder typografisches Minus. Ungültig → null. */
export function parseNumber(input: string): number | null {
  const s = input.trim().replace(/[−–]/g, "-").replace(",", ".").replace(/\s+/g, "");
  if (!/^[-+]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
