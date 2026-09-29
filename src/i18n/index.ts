import { type MessageKey, de } from "./de";
import { en } from "./en";
import type { Lang } from "./format";

export type { MessageKey } from "./de";
export type { Lang } from "./format";

const dictionaries: Record<Lang, Record<MessageKey, string>> = { de, en };

export type Params = Record<string, string | number>;

export function translate(lang: Lang, key: MessageKey, params?: Params): string {
  const text = dictionaries[lang][key];
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export const allKeys = (): MessageKey[] => Object.keys(de) as MessageKey[];
export const dictionary = (lang: Lang): Record<MessageKey, string> => dictionaries[lang];
