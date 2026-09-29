import type { Speech } from "@/app/play";
import { type Lang, translate } from "@/i18n";
import { formatNumber } from "@/i18n/format";

/** Setzt Kubis Sätze in der aktuellen Sprache zusammen (Zahlen im Landesformat, Knopfnamen übersetzt). */
export function speechText(speech: Speech, lang: Lang): string {
  return speech.lines
    .map((line) => {
      const params: Record<string, string | number> = {};
      for (const [k, v] of Object.entries(line.params ?? {}))
        params[k] = typeof v === "number" ? formatNumber(v, lang) : v;
      for (const [k, key] of Object.entries(line.keyParams ?? {})) params[k] = translate(lang, key);
      return translate(lang, line.key, params);
    })
    .join(" ");
}
