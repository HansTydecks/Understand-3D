import type { KeyboardEvent } from "react";

import { usePlay } from "@/app/play";
import { useLang, useT } from "@/app/settings";
import type { Axis } from "@/domain/coords";
import { type Field, displayValue } from "@/domain/geometry";
import type { MessageKey } from "@/i18n";
import { formatInput, formatPoint, parseNumber } from "@/i18n/format";

import { IconMinus, IconPlus } from "./Icons";
import { NumberBox } from "./NumberBox";

const AXES: Axis[] = ["x", "y", "z"];
const FIELD_LABEL: Record<Field, MessageKey> = {
  x: "field.x",
  y: "field.y",
  z: "field.z",
  w: "field.w",
  d: "field.d",
  h: "field.h",
};

/** Großes Eingabefeld mit Plus/Minus – für Kinderhände und für alle, die das Minus noch suchen. */
function PointField({ axis }: { axis: Axis }) {
  const value = usePlay((s) => s.input[axis]);
  const moving = usePlay((s) => s.phase === "moving");
  const setInput = usePlay((s) => s.setInput);
  const submit = usePlay((s) => s.submitPoint);
  const lang = useLang();
  const t = useT();
  const step = (d: number) => setInput(axis, formatInput((parseNumber(value) ?? 0) + d, lang));
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") submit();
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      step(e.key === "ArrowUp" ? 1 : -1);
    }
  };
  const name = t(FIELD_LABEL[axis]);
  return (
    <div className={`pointfield pointfield-${axis}`}>
      <span className="pointfield-axis">{name} =</span>
      <button
        type="button"
        className="stepper"
        aria-label={t("panel.minus", { field: name })}
        onClick={() => step(-1)}
      >
        <IconMinus />
      </button>
      <input
        type="text"
        inputMode="decimal"
        aria-label={name}
        data-testid={`input-${axis}`}
        value={value}
        placeholder="?"
        disabled={moving}
        onChange={(e) => setInput(axis, e.target.value)}
        onKeyDown={onKey}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        className="stepper"
        aria-label={t("panel.plus", { field: name })}
        onClick={() => step(1)}
      >
        <IconPlus />
      </button>
    </div>
  );
}

function PointPanel() {
  const mission = usePlay((s) => s.mission);
  const input = usePlay((s) => s.input);
  const phase = usePlay((s) => s.phase);
  const submit = usePlay((s) => s.submitPoint);
  const lang = useLang();
  const t = useT();
  if (!mission || mission.type === "build") return null;
  const axes = AXES.slice(0, mission.scene.dims);
  const values = axes.map((a) => parseNumber(input[a]));
  const complete = values.filter((v): v is number => v !== null);
  const preview = complete.length === axes.length ? formatPoint(complete, lang) : null;
  return (
    <div className="panel coord-panel" data-testid="coord-panel">
      <div className="panel-title">{t(mission.type === "read" ? "panel.read" : "panel.goto")}</div>
      <div className="pointfields">
        {axes.map((a) => (
          <PointField key={a} axis={a} />
        ))}
      </div>
      <div className="panel-footer">
        <span className="point-preview" aria-live="polite">
          {axes.length > 1 && preview ? `${t("panel.point")} ${preview}` : ""}
        </span>
        <button
          type="button"
          className="btn btn-primary btn-big"
          onClick={submit}
          disabled={phase !== "play"}
          data-testid="go"
        >
          {t(mission.type === "read" ? "ui.check" : "ui.go")}
        </button>
      </div>
    </div>
  );
}

/** Steuerpult für die 2D-Baumission (Kapitel 2): Ecke und Größe einer Fläche. */
function ShapePanel() {
  const mission = usePlay((s) => s.mission);
  const shapes = usePlay((s) => s.shapes);
  const selectedId = usePlay((s) => s.selectedId);
  const ruler = usePlay((s) => s.ruler);
  const phase = usePlay((s) => s.phase);
  const setField = usePlay((s) => s.setField);
  const check = usePlay((s) => s.checkBuild);
  const t = useT();
  if (!mission || mission.type !== "build") return null;
  const shape = shapes.find((s) => s.id === selectedId) ?? shapes.find((s) => !s.fixed);
  if (!shape) return null;
  return (
    <div className="panel coord-panel" data-testid="coord-panel">
      <div className="panel-title">{t("panel.build")}</div>
      <div className="shapefields">
        {mission.fields.map((f) => {
          const value = displayValue(shape, f, ruler);
          const axis = f === "x" || f === "y" || f === "z" ? f : "size";
          return (
            <div key={f} className="shapefield">
              <button
                type="button"
                className="stepper"
                aria-label={t("panel.minus", { field: t(FIELD_LABEL[f]) })}
                onClick={() => setField(shape.id, f, value - 1)}
              >
                <IconMinus />
              </button>
              <NumberBox
                value={value}
                onCommit={(v) => setField(shape.id, f, v)}
                label={t(FIELD_LABEL[f])}
                ariaLabel={t(FIELD_LABEL[f])}
                axis={axis}
                testId={`field-${f}`}
              />
              <button
                type="button"
                className="stepper"
                aria-label={t("panel.plus", { field: t(FIELD_LABEL[f]) })}
                onClick={() => setField(shape.id, f, value + 1)}
              >
                <IconPlus />
              </button>
            </div>
          );
        })}
      </div>
      <div className="panel-footer">
        <span />
        <button
          type="button"
          className="btn btn-primary btn-big"
          onClick={check}
          disabled={phase !== "play"}
          data-testid="check"
        >
          {t("ui.check")}
        </button>
      </div>
    </div>
  );
}

export function CoordPanel() {
  const mission = usePlay((s) => s.mission);
  const phase = usePlay((s) => s.phase);
  if (!mission || phase === "intro" || phase === "success") return null;
  if (mission.type === "build") return mission.tools.onObject ? null : <ShapePanel />;
  return <PointPanel />;
}
