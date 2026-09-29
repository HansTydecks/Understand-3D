import { type KeyboardEvent, useRef, useState } from "react";

import { useLang } from "@/app/settings";
import { formatInput, parseNumber } from "@/i18n/format";

interface Props {
  value: number;
  onCommit: (value: number) => void;
  label: string;
  ariaLabel: string;
  axis?: "x" | "y" | "z" | "size";
  readOnly?: boolean;
  step?: number;
  testId?: string;
}

/**
 * Zahlenfeld wie in Tinkercad: anklicken, Zahl tippen, Enter. Pfeiltasten ↑/↓ ändern um einen Rasterschritt.
 * Ungültige Eingaben werden verworfen, der alte Wert bleibt stehen.
 */
export function NumberBox({
  value,
  onCommit,
  label,
  ariaLabel,
  axis = "size",
  readOnly = false,
  step = 1,
  testId,
}: Props) {
  const lang = useLang();
  const shown = formatInput(value, lang);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const commit = () => {
    const n = parseNumber(text);
    setEditing(false);
    if (n === null) {
      setText(shown);
      return;
    }
    if (n !== value) onCommit(n);
    else setText(shown);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commit();
      input.current?.blur();
    } else if (e.key === "Escape") {
      setText(shown);
      setEditing(false);
      input.current?.blur();
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const base = parseNumber(text) ?? value;
      const next = base + (e.key === "ArrowUp" ? step : -step);
      setText(formatInput(next, lang));
      onCommit(next);
    }
  };

  return (
    <label className={`numberbox numberbox-${axis} ${readOnly ? "is-readonly" : ""}`}>
      <span className="numberbox-label">{label}</span>
      <input
        ref={input}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        data-testid={testId}
        value={editing ? text : shown}
        readOnly={readOnly}
        onFocus={(e) => {
          if (readOnly) return;
          setText(shown);
          setEditing(true);
          e.currentTarget.select();
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (!readOnly && editing) commit();
        }}
        onKeyDown={readOnly ? undefined : onKey}
      />
    </label>
  );
}
