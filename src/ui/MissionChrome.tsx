import { useEffect, useRef } from "react";

import { pointTargets, usePlay } from "@/app/play";
import { useLang, useT } from "@/app/settings";
import { formatNumber } from "@/i18n/format";
import { MISSIONS, missionIndex } from "@/missions/data";
import type { Tools } from "@/missions/types";
import { type Face, liveAngles, subscribeAngles, useView } from "@/scene/view";

import {
  IconAlign,
  IconBlueprint,
  IconHome,
  IconMinus,
  IconPlus,
  IconRestart,
  IconRuler,
  IconTrash,
  ShapeIcon,
} from "./Icons";

/** War das Werkzeug in der vorherigen Mission noch nicht da? Dann bekommt es ein „Neu!“. */
function useIsNew(tool: keyof Tools): boolean {
  const mission = usePlay((s) => s.mission);
  if (!mission) return false;
  const prev = MISSIONS[missionIndex(mission.id) - 1];
  const now = mission.tools[tool];
  const before = prev?.tools[tool];
  const has = (v: unknown) => (Array.isArray(v) ? v.length > 0 : Boolean(v));
  return has(now) && !has(before);
}

export function Toolbar() {
  const mission = usePlay((s) => s.mission);
  const phase = usePlay((s) => s.phase);
  const selectedId = usePlay((s) => s.selectedId);
  const shapes = usePlay((s) => s.shapes);
  const alignActive = usePlay((s) => s.alignActive);
  const showBlueprint = usePlay((s) => s.showBlueprint);
  const start = usePlay((s) => s.start);
  const del = usePlay((s) => s.deleteSelected);
  const toggleAlign = usePlay((s) => s.toggleAlign);
  const toggleBlueprint = usePlay((s) => s.toggleBlueprint);
  const alignNew = useIsNew("align");
  const t = useT();
  if (!mission) return null;
  const selected = shapes.find((s) => s.id === selectedId);
  const canDelete = mission.tools.shapes.length > 0 && selected !== undefined && !selected.fixed;
  const playing = phase === "play";
  return (
    <div className="toolbar" role="toolbar" aria-label="Werkzeuge">
      <div className="toolbar-group">
        <button type="button" className="tool" onClick={() => start(mission.id)} title={t("nav.restart")}>
          <IconRestart />
          <span>{t("nav.restart")}</span>
        </button>
        {mission.tools.shapes.length > 0 && (
          <button
            type="button"
            className="tool"
            onClick={del}
            disabled={!canDelete || !playing}
            title={t("ui.delete")}
            data-testid="delete"
          >
            <IconTrash />
            <span>{t("ui.delete")}</span>
          </button>
        )}
      </div>
      <div className="toolbar-group">
        {mission.type === "build" && mission.blueprint && (
          <button
            type="button"
            className={`tool ${showBlueprint ? "is-active" : ""}`}
            onClick={toggleBlueprint}
            aria-pressed={showBlueprint}
          >
            <IconBlueprint />
            <span>{t("ui.blueprint")}</span>
          </button>
        )}
        {mission.tools.align && (
          <button
            type="button"
            className={`tool ${alignActive ? "is-active" : ""} ${alignNew ? "is-new" : ""}`}
            onClick={toggleAlign}
            aria-pressed={alignActive}
            disabled={!playing}
            data-testid="tool-align"
          >
            <IconAlign />
            <span>{t("tool.align")}</span>
            {alignNew && <em className="new-badge">{t("ui.newTool")}</em>}
          </button>
        )}
      </div>
    </div>
  );
}

const FACES: {
  face: Face | "bottom";
  key: "view.top" | "view.bottom" | "view.front" | "view.back" | "view.left" | "view.right";
}[] = [
  { face: "front", key: "view.front" },
  { face: "back", key: "view.back" },
  { face: "right", key: "view.right" },
  { face: "left", key: "view.left" },
  { face: "top", key: "view.top" },
  { face: "bottom", key: "view.bottom" },
];

/** Ansichtswürfel wie in Tinkercad – als CSS-Würfel, der sich mit der Kamera dreht. */
function ViewCube() {
  const cube = useRef<HTMLDivElement>(null);
  const face = useView((s) => s.face);
  const t = useT();
  useEffect(() => {
    const update = () => {
      const deg = 180 / Math.PI;
      if (cube.current) {
        cube.current.style.transform = `rotateX(${(-liveAngles.phi * deg).toFixed(2)}deg) rotateY(${(-liveAngles.theta * deg).toFixed(2)}deg)`;
      }
    };
    update();
    return subscribeAngles(update);
  }, []);
  return (
    <div className="viewcube" aria-label={t("view.cube")} role="group">
      <div className="viewcube-cube" ref={cube}>
        {FACES.map(({ face: f, key }) => (
          <button
            key={f}
            type="button"
            className={`viewcube-face face-${f}`}
            onClick={() => f !== "bottom" && face(f)}
            tabIndex={f === "bottom" ? -1 : 0}
            data-testid={`view-${f}`}
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ViewControls() {
  const tools = usePlay((s) => s.mission?.tools);
  const home = useView((s) => s.goHome);
  const zoom = useView((s) => s.zoomBy);
  const isNew = useIsNew("viewCube");
  const t = useT();
  if (!tools?.viewCube) return null;
  return (
    <div className={`view-controls ${isNew ? "is-new" : ""}`}>
      <ViewCube />
      <div className="view-buttons">
        <button
          type="button"
          className="view-btn"
          onClick={home}
          title={t("view.home")}
          aria-label={t("view.home")}
        >
          <IconHome />
        </button>
        <button
          type="button"
          className="view-btn"
          onClick={() => zoom(1 / 1.2)}
          title={t("view.zoomIn")}
          aria-label={t("view.zoomIn")}
        >
          <IconPlus />
        </button>
        <button
          type="button"
          className="view-btn"
          onClick={() => zoom(1.2)}
          title={t("view.zoomOut")}
          aria-label={t("view.zoomOut")}
        >
          <IconMinus />
        </button>
      </div>
      {isNew && <em className="new-badge">{t("ui.newTool")}</em>}
    </div>
  );
}

/** Rechte Leiste wie in Tinkercad: oben das Lineal, darunter die Grundformen. */
export function SidePanel() {
  const mission = usePlay((s) => s.mission);
  const phase = usePlay((s) => s.phase);
  const ruler = usePlay((s) => s.ruler);
  const rulerPicking = usePlay((s) => s.rulerPicking);
  const addShape = usePlay((s) => s.addShape);
  const togglePick = usePlay((s) => s.toggleRulerPick);
  const toggleMode = usePlay((s) => s.toggleRulerMode);
  const rulerNew = useIsNew("rulerMove");
  const toggleNew = useIsNew("rulerToggle");
  const shapesNew = useIsNew("shapes");
  const t = useT();
  if (!mission) return null;
  const { tools } = mission;
  const playing = phase === "play";
  return (
    <aside className="side-panel" data-testid="side-panel">
      {(tools.rulerMove || tools.rulerToggle) && (
        <section className="side-section">
          {tools.rulerMove && (
            <button
              type="button"
              className={`side-tool ${rulerPicking ? "is-active" : ""} ${rulerNew ? "is-new" : ""}`}
              onClick={togglePick}
              disabled={!playing}
              aria-pressed={rulerPicking}
              data-testid="tool-ruler"
            >
              <IconRuler />
              <span>{t("tool.ruler")}</span>
              {rulerNew && <em className="new-badge">{t("ui.newTool")}</em>}
            </button>
          )}
          {rulerPicking && <p className="side-hint">{t("tool.rulerPick")}</p>}
          {tools.rulerToggle && (
            <div className={`ruler-toggle ${toggleNew ? "is-new" : ""}`}>
              <span>{t("tool.measure")}</span>
              <div className="segmented" role="group" aria-label={t("tool.measure")}>
                <button
                  type="button"
                  aria-pressed={ruler.mode === "edge"}
                  className={ruler.mode === "edge" ? "is-on" : ""}
                  onClick={() => ruler.mode !== "edge" && toggleMode()}
                  data-testid="ruler-edge"
                >
                  {t("tool.edge")}
                </button>
                <button
                  type="button"
                  aria-pressed={ruler.mode === "center"}
                  className={ruler.mode === "center" ? "is-on" : ""}
                  onClick={() => ruler.mode !== "center" && toggleMode()}
                  data-testid="ruler-center"
                >
                  {t("tool.center")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
      {tools.shapes.length > 0 && (
        <section className={`side-section ${shapesNew ? "is-new" : ""}`}>
          <h2 className="side-title">{t("shapes.title")}</h2>
          <div className="shape-tiles">
            {tools.shapes.map((kind) => {
              const name = t(kind === "box" ? "shape.box" : "shape.cylinder");
              return (
                <button
                  key={kind}
                  type="button"
                  className="shape-tile"
                  onClick={() => addShape(kind)}
                  disabled={!playing}
                  aria-label={t("shape.add", { shape: name })}
                  data-testid={`add-${kind}`}
                >
                  <ShapeIcon kind={kind} />
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </aside>
  );
}

export const needsSidePanel = (tools: Tools): boolean =>
  tools.shapes.length > 0 || tools.rulerMove || tools.rulerToggle;

export function SnapGrid() {
  const unit = usePlay((s) => s.scene.unit);
  const lang = useLang();
  const t = useT();
  if (unit !== "mm") return null;
  return (
    <div className="snap-grid">
      <span>{t("snap.label")}</span>
      <strong>
        {formatNumber(1, lang)}
        {lang === "de" ? ",0" : ".0"} {t("unit.mm")}
      </strong>
    </div>
  );
}

export function GoalCard() {
  const mission = usePlay((s) => s.mission);
  const phase = usePlay((s) => s.phase);
  const collected = usePlay((s) => s.collected);
  const check = usePlay((s) => s.checkBuild);
  const t = useT();
  if (!mission || phase === "intro") return null;
  const total = pointTargets(mission).length;
  const found = collected.filter(Boolean).length;
  return (
    <div className="goal-card" data-testid="goal-card">
      <span className="goal-label">{t("ui.goal")}</span>
      <span className="goal-text">{t(mission.goal)}</span>
      {total > 1 && (
        <span className="goal-count" aria-label={t("ui.found", { n: found, total })}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`goal-dot ${collected[i] ? "is-on" : ""}`} />
          ))}
        </span>
      )}
      {mission.type === "build" && mission.tools.onObject && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={check}
          disabled={phase !== "play"}
          data-testid="check"
        >
          {t("ui.check")}
        </button>
      )}
    </div>
  );
}

/** Bauplan für das Meisterstück: Ansicht von vorne mit Maßen, darunter die Angaben in Worten. */
export function Blueprint() {
  const mission = usePlay((s) => s.mission);
  const show = usePlay((s) => s.showBlueprint);
  const phase = usePlay((s) => s.phase);
  const t = useT();
  if (!mission || mission.type !== "build" || !mission.blueprint || !show || phase === "intro") return null;
  return (
    <div className="blueprint" data-testid="blueprint">
      <h2>{t("ui.blueprint")}</h2>
      <p className="blueprint-caption">{t("blueprint.front")}</p>
      <svg viewBox="0 0 300 150" className="blueprint-svg" role="img" aria-label={t("blueprint.front")}>
        <rect x="40" y="36" width="220" height="18" className="bp-part" />
        <rect x="40" y="54" width="18" height="72" className="bp-part" />
        <rect x="242" y="54" width="18" height="72" className="bp-part" />
        <line x1="20" y1="126" x2="280" y2="126" className="bp-ground" />
        <line x1="40" y1="20" x2="260" y2="20" className="bp-dim" />
        <text x="150" y="15" className="bp-text">
          60 mm
        </text>
        <line x1="272" y1="54" x2="272" y2="126" className="bp-dim" />
        <text x="277" y="94" className="bp-text bp-left">
          20
        </text>
        <line x1="272" y1="36" x2="272" y2="54" className="bp-dim" />
        <text x="277" y="49" className="bp-text bp-left">
          5
        </text>
        <line x1="40" y1="140" x2="58" y2="140" className="bp-dim" />
        <text x="49" y="150" className="bp-text">
          5
        </text>
        <circle cx="40" cy="126" r="4" className="bp-origin" />
        <text x="12" y="118" className="bp-text bp-left">
          x = −30
        </text>
      </svg>
      <ul>
        <li>{t("blueprint.leg")}</li>
        <li>{t("blueprint.seat")}</li>
        <li>{t("blueprint.start")}</li>
        <li>{t("blueprint.legs")}</li>
        <li>{t("blueprint.seatOn")}</li>
      </ul>
    </div>
  );
}
