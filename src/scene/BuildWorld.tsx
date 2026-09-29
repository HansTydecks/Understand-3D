import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  CylinderGeometry,
  EdgesGeometry,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from "three";

import { speedFactor } from "@/app/motion";
import { helpVisible, usePlay } from "@/app/play";
import { useSettings, useT } from "@/app/settings";
import { type Axis, type Unit, type Vec3, toScene, unitScale, vec } from "@/domain/coords";
import {
  type AlignMode,
  type Field,
  type Shape,
  type TargetShape,
  alignTo,
  center,
  displayValue,
  maxCorner,
  referencePoint,
} from "@/domain/geometry";
import type { MessageKey } from "@/i18n";
import type { BuildMission } from "@/missions/types";
import { NumberBox } from "@/ui/NumberBox";

import { AXIS_COLOR } from "./colors";
import { Anchor, useOccluder } from "./overlay";
import { DottedLine } from "./PointWorld";
import { Spring } from "./tween";

const BOX = new BoxGeometry(1, 1, 1);
const CYL = new CylinderGeometry(0.5, 0.5, 1, 48);
const BOX_EDGES = new EdgesGeometry(BOX);
const CYL_EDGES = new EdgesGeometry(CYL, 30);
const PLATE_HEIGHT = 0.06;

const geometryFor = (kind: Shape["kind"]) => (kind === "cylinder" ? CYL : BOX);
const edgesFor = (kind: Shape["kind"]) => (kind === "cylinder" ? CYL_EDGES : BOX_EDGES);

/** Mittelpunkt und Skalierung in Szenenkoordinaten. Platten (2D) sind hauchdünn. */
function sceneBox(pos: Vec3, size: Vec3, kind: Shape["kind"], unit: Unit) {
  const s = unitScale(unit);
  if (kind === "plate") {
    const c = toScene(vec(pos.x + size.x / 2, pos.y + size.y / 2, 0), unit);
    return {
      position: [c[0], PLATE_HEIGHT / 2, c[2]] as const,
      scale: [size.x * s, PLATE_HEIGHT, size.y * s] as const,
    };
  }
  const c = toScene(center({ pos, size }), unit);
  return { position: c, scale: [size.x * s, size.z * s, size.y * s] as const };
}

function ShapeMesh({ shape, selected, unit }: { shape: Shape; selected: boolean; unit: Unit }) {
  const select = usePlay((s) => s.select);
  const calm = useSettings((s) => s.calm);
  const group = useRef<Group>(null);
  const handles = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  useOccluder(body);
  const springs = useRef(
    [shape.pos.x, shape.pos.y, shape.pos.z, shape.size.x, shape.size.y, shape.size.z].map(
      (v) => new Spring(v),
    ),
  );
  const [hover, setHover] = useState(false);

  useFrame((_, dt) => {
    const sp = springs.current;
    const target = [shape.pos.x, shape.pos.y, shape.pos.z, shape.size.x, shape.size.y, shape.size.z];
    const stiffness = 170 * speedFactor(calm) ** 2;
    const damping = calm ? 26 : 13 * speedFactor(calm);
    const [px = 0, py = 0, pz = 0, w = 1, d = 1, h = 1] = sp.map((spring, i) =>
      spring.step(target[i] ?? 0, dt, stiffness, damping),
    );
    const box = sceneBox(
      vec(px, py, pz),
      vec(Math.max(0.2, w), Math.max(0.2, d), Math.max(0.2, h)),
      shape.kind,
      unit,
    );
    group.current?.position.set(box.position[0], box.position[1], box.position[2]);
    group.current?.scale.set(box.scale[0], box.scale[1], box.scale[2]);
    if (handles.current) {
      handles.current.position.set(box.position[0], box.position[1], box.position[2]);
      const [sx, sy, sz] = box.scale;
      handles.current.children.forEach((h, i) => {
        if (i < 4) h.position.set(((i % 2) - 0.5) * sx, -sy / 2, (Math.floor(i / 2) - 0.5) * sz);
        else if (i === 4) h.position.set(0, sy / 2 + 0.02, 0);
        else h.position.set(0, sy / 2 + 0.55, 0);
      });
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return;
    e.stopPropagation();
    select(shape.id);
  };

  const edgeColor = selected ? "#1c7ed6" : shape.fixed ? "#7a5a3a" : "#3b3b3b";
  return (
    <>
      <group ref={group}>
        <mesh
          ref={body}
          geometry={geometryFor(shape.kind)}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = "";
          }}
        >
          <meshStandardMaterial
            color={shape.color}
            roughness={shape.fixed ? 0.8 : 0.5}
            emissive={selected || hover ? "#4dabf7" : "#000000"}
            emissiveIntensity={selected ? 0.18 : hover ? 0.1 : 0}
          />
        </mesh>
        <lineSegments geometry={edgesFor(shape.kind)}>
          <lineBasicMaterial color={edgeColor} transparent opacity={selected ? 1 : 0.55} />
        </lineSegments>
      </group>
      {selected && !shape.fixed && shape.kind !== "plate" && (
        <group ref={handles}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i}>
              <boxGeometry args={[0.13, 0.13, 0.13]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
          <mesh rotation={[0, 0, 0]}>
            <coneGeometry args={[0.1, 0.28, 16]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        </group>
      )}
    </>
  );
}

const PIPS: Record<"top" | "front" | "right", [number, number][]> = {
  top: [
    [-0.25, -0.25],
    [0.25, -0.25],
    [0, 0],
    [-0.25, 0.25],
    [0.25, 0.25],
  ],
  front: [
    [-0.22, 0.22],
    [0.22, -0.22],
  ],
  right: [
    [-0.25, 0.25],
    [0, 0],
    [0.25, -0.25],
  ],
};

/** Geisterbild des Ziels (durchscheinend, pulsiert), als Spielwürfel oder als braune Erde. */
function Ghost({
  target,
  style,
  unit,
}: {
  target: TargetShape;
  style: BuildMission["ghostStyle"];
  unit: Unit;
}) {
  const mat = useRef<MeshStandardMaterial>(null);
  const time = useRef(0);
  const box = sceneBox(target.pos, target.size, target.kind, unit);
  useFrame((_, dt) => {
    time.current += dt;
    if (mat.current && style !== "soil") mat.current.opacity = 0.22 + Math.sin(time.current * 2.4) * 0.08;
  });
  if (style === "soil") {
    return (
      <mesh
        position={[box.position[0], 0.012, box.position[2]]}
        scale={[box.scale[0], 0.02, box.scale[2]]}
        geometry={BOX}
      >
        <meshStandardMaterial color="#8d5b3a" roughness={1} />
      </mesh>
    );
  }
  return (
    <group position={box.position} scale={box.scale}>
      <mesh geometry={geometryFor(target.kind)}>
        <meshStandardMaterial
          ref={mat}
          color={style === "dice" ? "#ffffff" : "#74c0fc"}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>
      <lineSegments geometry={edgesFor(target.kind)}>
        <lineBasicMaterial color="#1c7ed6" transparent opacity={0.8} />
      </lineSegments>
      {style === "dice" && (
        <>
          {PIPS.top.map(([a, b], i) => (
            <mesh key={`t${i}`} position={[a, 0.5, b]} scale={[0.07, 0.01, 0.07]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#2b3440" />
            </mesh>
          ))}
          {PIPS.front.map(([a, b], i) => (
            <mesh key={`f${i}`} position={[a, b, 0.5]} scale={[0.07, 0.07, 0.01]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#2b3440" />
            </mesh>
          ))}
          {PIPS.right.map(([a, b], i) => (
            <mesh key={`r${i}`} position={[0.5, b, a]} scale={[0.01, 0.07, 0.07]}>
              <sphereGeometry args={[1, 12, 8]} />
              <meshBasicMaterial color="#2b3440" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

function Marker({ point, unit }: { point: Vec3; unit: Unit }) {
  const [x, y, z] = toScene(point, unit);
  return (
    <group position={[x, y + 0.012, z]}>
      {[Math.PI / 4, -Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, r, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.09]} />
          <meshBasicMaterial color="#c92a2a" />
        </mesh>
      ))}
    </group>
  );
}

/** Lineal wie in Tinkercad: ein „L“ mit Skala, dessen Ecke der Nullpunkt ist. */
function RulerGizmo() {
  const ruler = usePlay((s) => s.ruler);
  const tools = usePlay((s) => s.mission?.tools);
  const toggle = usePlay((s) => s.toggleRulerMode);
  const unit = usePlay((s) => s.scene.unit);
  const t = useT();
  const group = useRef<Group>(null);
  const springs = useRef({ x: new Spring(ruler.origin.x), y: new Spring(ruler.origin.y) });
  useFrame((_, dt) => {
    const x = springs.current.x.step(ruler.origin.x, dt, 90, 14);
    const y = springs.current.y.step(ruler.origin.y, dt, 90, 14);
    const p = toScene(vec(x, y, 0), unit);
    group.current?.position.set(p[0], 0.006, p[2]);
  });
  const ticks = useMemo(() => Array.from({ length: 13 }, (_, i) => (i + 1) * 0.25), []);
  const arm = 3.4;
  return (
    <group ref={group}>
      <mesh position={[arm / 2 - 0.2, 0.015, 0.2]}>
        <boxGeometry args={[arm + 0.4, 0.03, 0.4]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.6} />
      </mesh>
      <mesh position={[-0.2, 0.015, -(arm / 2) + 0.2]}>
        <boxGeometry args={[0.4, 0.03, arm + 0.4]} />
        <meshStandardMaterial color="#f8f9fa" roughness={0.6} />
      </mesh>
      {ticks.map((d) => (
        <group key={d}>
          <mesh position={[d, 0.035, 0.07 + (d % 1 === 0 ? 0.06 : 0)]}>
            <boxGeometry args={[0.02, 0.01, d % 1 === 0 ? 0.26 : 0.14]} />
            <meshBasicMaterial color="#495057" />
          </mesh>
          <mesh position={[-0.07 - (d % 1 === 0 ? 0.06 : 0), 0.035, -d]}>
            <boxGeometry args={[d % 1 === 0 ? 0.26 : 0.14, 0.01, 0.02]} />
            <meshBasicMaterial color="#495057" />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.2, 0.04, 0.2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
        <meshStandardMaterial color="#1c7ed6" />
      </mesh>
      {tools?.rulerToggle && (
        <Anchor position={[-0.75, 0.05, 0.75]} interactive z={40}>
          <button
            type="button"
            className={`ruler-mode is-${ruler.mode}`}
            onClick={toggle}
            title={t("tool.measure")}
            data-testid="ruler-mode-scene"
          >
            {ruler.mode === "edge" ? t("tool.edge") : t("tool.center")}
          </button>
        </Anchor>
      )}
    </group>
  );
}

function RulerSpots({ spots, unit }: { spots: Vec3[]; unit: Unit }) {
  const place = usePlay((s) => s.placeRuler);
  const t = useT();
  return (
    <>
      {spots.map((p, i) => (
        <Anchor key={i} position={toScene(p, unit)} interactive z={45}>
          <button
            type="button"
            className="ruler-spot"
            aria-label={t("tool.rulerPick")}
            data-testid={`ruler-spot-${i}`}
            onClick={() => place(p)}
          />
        </Anchor>
      ))}
    </>
  );
}

const ALIGN_MODES: AlignMode[] = ["min", "mid", "max"];
const alignLabel: Record<AlignMode, MessageKey> = {
  min: "tool.alignMin",
  mid: "tool.alignMid",
  max: "tool.alignMax",
};

function AlignDots({ keyShape, unit }: { keyShape: Shape; unit: Unit }) {
  const apply = usePlay((s) => s.applyAlign);
  const preview = usePlay((s) => s.previewAlign);
  const t = useT();
  const off = 1.6 / unitScale(unit);
  const m = maxCorner(keyShape);
  const c = center(keyShape);
  const dots: { axis: Axis; mode: AlignMode; p: Vec3 }[] = [
    ...ALIGN_MODES.map((mode) => ({
      axis: "x" as const,
      mode,
      p: vec(mode === "min" ? keyShape.pos.x : mode === "mid" ? c.x : m.x, keyShape.pos.y - off, 0),
    })),
    ...ALIGN_MODES.map((mode) => ({
      axis: "y" as const,
      mode,
      p: vec(keyShape.pos.x - off, mode === "min" ? keyShape.pos.y : mode === "mid" ? c.y : m.y, 0),
    })),
  ];
  return (
    <>
      {dots.map((d) => {
        const label = t(d.axis === "x" ? "tool.alignX" : "tool.alignY", { mode: t(alignLabel[d.mode]) });
        return (
          <Anchor key={`${d.axis}${d.mode}`} position={toScene(d.p, unit)} interactive z={45}>
            <button
              type="button"
              className={`align-dot is-${d.mode} axis-${d.axis}`}
              aria-label={label}
              title={label}
              data-testid={`align-${d.axis}-${d.mode}`}
              onPointerEnter={() => preview({ axis: d.axis, mode: d.mode })}
              onPointerLeave={() => preview(null)}
              onClick={() => apply(d.axis, d.mode)}
            />
          </Anchor>
        );
      })}
    </>
  );
}

const FIELD_LABEL: Record<Field, MessageKey> = {
  x: "field.x",
  y: "field.y",
  z: "field.z",
  w: "field.w",
  d: "field.d",
  h: "field.h",
};

function FieldAt({ shape, field, at, unit }: { shape: Shape; field: Field; at: Vec3; unit: Unit }) {
  const ruler = usePlay((s) => s.ruler);
  const setField = usePlay((s) => s.setField);
  const t = useT();
  const axis = field === "x" || field === "y" || field === "z" ? field : "size";
  return (
    <Anchor position={toScene(at, unit)} interactive z={50}>
      <NumberBox
        value={displayValue(shape, field, ruler)}
        onCommit={(v) => setField(shape.id, field, v)}
        label={t(FIELD_LABEL[field])}
        ariaLabel={t(FIELD_LABEL[field])}
        axis={axis}
        readOnly={Boolean(shape.fixed)}
        testId={`field-${field}`}
      />
    </Anchor>
  );
}

function SizeLine({ from, to, unit }: { from: Vec3; to: Vec3; unit: Unit }) {
  const a = toScene(from, unit);
  const b = toScene(to, unit);
  const mid: [number, number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const w = 0.025;
  const along = (d: number) => (Math.abs(d) > 1e-6 ? len : w);
  const scale: [number, number, number] = [along(b[0] - a[0]), along(b[1] - a[1]), along(b[2] - a[2])];
  return (
    <mesh position={mid} scale={scale} geometry={BOX}>
      <meshBasicMaterial color="#495057" />
    </mesh>
  );
}

/**
 * Zahlenfelder direkt an der Form wie in Tinkercad: Maße an den Kanten, dazu der Weg vom Lineal aus –
 * erst x, dann y, dann z (dieselbe Zerlegung wie Kubis Weg in den ersten Kapiteln).
 */
function DimensionFields({ shape, fields, unit }: { shape: Shape; fields: Field[]; unit: Unit }) {
  const ruler = usePlay((s) => s.ruler);
  const off = 0.75 / unitScale(unit);
  const o = ruler.origin;
  const ref = referencePoint(shape, ruler.mode);
  const m = maxCorner(shape);
  const c = center(shape);
  const has = (f: Field) => fields.includes(f);
  const mid = (a: number, b: number) => (a + b) / 2;
  // Kurze Wege (Form nah am Lineal): Felder um die Ecke herum verteilen, damit nichts überlappt.
  const cell = 1 / unitScale(unit);
  const xAt =
    Math.abs(ref.x - o.x) >= 2.5 * cell
      ? vec(mid(o.x, ref.x), o.y - off * 1.3, 0)
      : vec(ref.x - off * 2.8, ref.y - off * 1.2, 0);
  const yAt =
    Math.abs(ref.y - o.y) >= 2.5 * cell
      ? vec(ref.x - off * 1.7, mid(o.y, ref.y), 0)
      : vec(ref.x - off * 0.6, ref.y - off * 3.4, 0);
  const zAt =
    shape.pos.z >= 2.5 * cell
      ? vec(ref.x - off * 1.4, ref.y - off * 1.4, shape.pos.z / 2)
      : vec(ref.x - off * 1.3, ref.y - off * 1.3, shape.pos.z + off * 2.4);
  return (
    <group>
      <DottedLine from={vec(o.x, o.y, 0)} to={vec(ref.x, o.y, 0)} color={AXIS_COLOR.x} />
      <DottedLine from={vec(ref.x, o.y, 0)} to={vec(ref.x, ref.y, 0)} color={AXIS_COLOR.y} />
      {shape.pos.z > 0 && (
        <DottedLine from={vec(ref.x, ref.y, 0)} to={vec(ref.x, ref.y, shape.pos.z)} color={AXIS_COLOR.z} />
      )}
      {has("x") && <FieldAt shape={shape} field="x" unit={unit} at={xAt} />}
      {has("y") && <FieldAt shape={shape} field="y" unit={unit} at={yAt} />}
      {has("z") && <FieldAt shape={shape} field="z" unit={unit} at={zAt} />}
      <SizeLine
        from={vec(shape.pos.x, shape.pos.y - off, shape.pos.z)}
        to={vec(m.x, shape.pos.y - off, shape.pos.z)}
        unit={unit}
      />
      <SizeLine
        from={vec(m.x + off, shape.pos.y, shape.pos.z)}
        to={vec(m.x + off, m.y, shape.pos.z)}
        unit={unit}
      />
      <SizeLine
        from={vec(m.x + off * 0.7, shape.pos.y - off * 0.7, shape.pos.z)}
        to={vec(m.x + off * 0.7, shape.pos.y - off * 0.7, m.z)}
        unit={unit}
      />
      {has("w") && (
        <FieldAt shape={shape} field="w" unit={unit} at={vec(c.x, shape.pos.y - off * 2, shape.pos.z)} />
      )}
      {has("d") && (
        <FieldAt shape={shape} field="d" unit={unit} at={vec(m.x + off * 2.2, c.y, shape.pos.z)} />
      )}
      {has("h") && (
        <FieldAt
          shape={shape}
          field="h"
          unit={unit}
          at={vec(m.x + off * 1.9, shape.pos.y - off * 1.9, c.z)}
        />
      )}
    </group>
  );
}

export function BuildWorld() {
  const mission = usePlay((s) => s.mission);
  const shapes = usePlay((s) => s.shapes);
  const selectedId = usePlay((s) => s.selectedId);
  const mistakes = usePlay((s) => s.mistakes);
  const phase = usePlay((s) => s.phase);
  const scene = usePlay((s) => s.scene);
  const rulerPicking = usePlay((s) => s.rulerPicking);
  const alignActive = usePlay((s) => s.alignActive);
  const alignPreview = usePlay((s) => s.alignPreview);
  if (!mission || mission.type !== "build") return null;
  const unit = scene.unit;
  const showGhost = mission.ghost === "always" || (helpVisible(mistakes) && phase !== "success");
  const selected = shapes.find((s) => s.id === selectedId);
  const keyShape = mission.alignKeyId ? shapes.find((s) => s.id === mission.alignKeyId) : undefined;
  const moving = shapes.find((s) => s.id === selectedId && !s.fixed) ?? shapes.find((s) => !s.fixed);
  const previewShape =
    alignPreview && keyShape && moving
      ? alignTo(moving, keyShape, alignPreview.axis, alignPreview.mode)
      : null;
  return (
    <group>
      {showGhost &&
        mission.targets.map((t, i) => <Ghost key={i} target={t} style={mission.ghostStyle} unit={unit} />)}
      {shapes.map((s) => (
        <ShapeMesh key={s.id} shape={s} selected={s.id === selectedId} unit={unit} />
      ))}
      {mission.markers?.map((p, i) => (
        <Marker key={i} point={p} unit={unit} />
      ))}
      {scene.ruler && <RulerGizmo />}
      {rulerPicking && mission.rulerSpots && <RulerSpots spots={mission.rulerSpots} unit={unit} />}
      {alignActive && keyShape && <AlignDots keyShape={keyShape} unit={unit} />}
      {previewShape && <Ghost target={previewShape} style="plain" unit={unit} />}
      {selected && mission.tools.onObject && phase !== "intro" && (
        <DimensionFields shape={selected} fields={mission.fields} unit={unit} />
      )}
    </group>
  );
}
