import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";

import { speedFactor } from "@/app/motion";
import { usePlay } from "@/app/play";
import { useLang, useSettings } from "@/app/settings";
import type { Axis } from "@/domain/coords";
import { formatNumber } from "@/i18n/format";

import { AXIS_COLOR } from "./colors";
import { Label } from "./Label";
import { damp } from "./tween";

type ArmKey = "x+" | "x-" | "y+" | "y-" | "z+";

interface ArmProps {
  arm: ArmKey;
  cells: number;
  valuePerCell: number;
  labelEvery: number;
  thick: boolean;
  target: number;
  big: boolean;
}

const dirOf = (arm: ArmKey): [number, number, number] => {
  switch (arm) {
    case "x+":
      return [1, 0, 0];
    case "x-":
      return [-1, 0, 0];
    case "y+":
      return [0, 0, -1];
    case "y-":
      return [0, 0, 1];
    case "z+":
      return [0, 1, 0];
  }
};

/** Beschriftung neben der Achse, senkrecht zu ihr versetzt (bleibt beim Wachsen an ihrem Platz). */
const labelOffset = (axis: Axis, big: boolean): [number, number, number] => {
  if (axis === "x") return big ? [0, -0.05, 0.62] : [0, 0, 0.42];
  if (axis === "y") return [-0.42, 0, 0];
  return [-0.38, 0, 0.1];
};

/** Ein Achsenarm vom Ursprung aus. Wächst animiert (Skalierung entlang der eigenen Richtung). */
function Arm({ arm, cells, valuePerCell, labelEvery, thick, target, big }: ArmProps) {
  const lang = useLang();
  const calm = useSettings((s) => s.calm);
  const axis = arm[0] as Axis;
  const sign = arm[1] === "+" ? 1 : -1;
  const color = AXIS_COLOR[axis];
  const group = useRef<Group>(null);
  const grow = useRef(target);
  const [labelsOn, setLabelsOn] = useState(target > 0.95);
  const dir = dirOf(arm);
  const width = thick ? 0.07 : 0.045;
  const length = cells + (sign > 0 ? 0.55 : 0.35);

  useFrame((_, dt) => {
    grow.current = damp(grow.current, target, 2.2 * speedFactor(calm), Math.min(dt, 0.1));
    const g = Math.max(grow.current, 0.0001);
    group.current?.scale.set(axis === "x" ? g : 1, axis === "z" ? g : 1, axis === "y" ? g : 1);
    if (group.current) group.current.visible = grow.current > 0.01;
    const on = grow.current > 0.95;
    if (on !== labelsOn) setLabelsOn(on);
  });

  const at = (d: number, offset: [number, number, number] = [0, 0, 0]): [number, number, number] => [
    dir[0] * d + offset[0],
    dir[1] * d + offset[1],
    dir[2] * d + offset[2],
  ];
  const barSize: [number, number, number] = [
    Math.abs(dir[0]) * length + width * (1 - Math.abs(dir[0])),
    Math.abs(dir[1]) * length + width * (1 - Math.abs(dir[1])),
    Math.abs(dir[2]) * length + width * (1 - Math.abs(dir[2])),
  ];
  const tickSize = (major: boolean): [number, number, number] => {
    const t = major ? (big ? 0.34 : 0.22) : 0.12;
    if (axis === "x") return [0.035, 0.02, t];
    if (axis === "y") return [t, 0.02, 0.035];
    return [t, 0.035, 0.035];
  };
  const ticks = useMemo(() => Array.from({ length: cells }, (_, i) => i + 1), [cells]);
  const offset = labelOffset(axis, big);
  const coneRotation: [number, number, number] =
    axis === "x" ? [0, 0, -Math.PI / 2] : axis === "y" ? [-Math.PI / 2, 0, 0] : [0, 0, 0];

  return (
    <group ref={group}>
      <mesh position={at(length / 2)}>
        <boxGeometry args={barSize} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {ticks.map((n) => (
        <mesh key={n} position={at(n)}>
          <boxGeometry args={tickSize(n % labelEvery === 0)} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
      {ticks
        .filter((n) => n % labelEvery === 0)
        .map((n) => (
          <Label
            key={`l${n}`}
            position={at(n, offset)}
            className={`axis-label axis-${axis} ${big ? "is-big" : ""}`}
            visible={labelsOn}
          >
            {formatNumber(sign * n * valuePerCell, lang)}
          </Label>
        ))}
      {sign > 0 && (
        <>
          <mesh position={at(length + 0.12)} rotation={coneRotation}>
            <coneGeometry args={[width * 2.4, 0.34, 20]} />
            <meshStandardMaterial color={color} roughness={0.45} />
          </mesh>
          <Label position={at(length + 0.62)} className={`axis-name axis-${axis}`} visible={labelsOn}>
            {axis}
          </Label>
        </>
      )}
    </group>
  );
}

/** Achsen mit Strichen und Zahlen. Mit jedem Kapitel wächst eine Achse dazu. */
export function Axes() {
  const scene = usePlay((s) => s.scene);
  const lang = useLang();
  const mm = scene.unit === "mm";
  const valuePerCell = mm ? 10 : 1;
  const posCells = Math.round(scene.max / valuePerCell);
  const negCells = Math.round(Math.abs(Math.min(scene.min, 0)) / valuePerCell);
  const zCells = Math.max(1, Math.round(scene.zMax / valuePerCell));
  const labelEvery = mm ? 2 : 1;
  const big = scene.dims === 1;
  const common = { valuePerCell, labelEvery, thick: big, big };
  // Schlüssel mit Einheit: Beim Wechsel Kästchen → mm erscheinen die Zahlen neu (1, 2, 3 → 10, 20, 30).
  const k = scene.unit;
  return (
    <group position={[0, 0.03, 0]}>
      <Arm key={`x+${k}`} arm="x+" cells={posCells} target={1} {...common} />
      <Arm key={`x-${k}`} arm="x-" cells={Math.max(negCells, 8)} target={negCells > 0 ? 1 : 0} {...common} />
      <Arm
        key={`y+${k}`}
        arm="y+"
        cells={posCells}
        target={scene.dims >= 2 ? 1 : 0}
        {...common}
        big={false}
      />
      <Arm
        key={`y-${k}`}
        arm="y-"
        cells={Math.max(negCells, 8)}
        target={scene.dims >= 2 && negCells > 0 ? 1 : 0}
        {...common}
        big={false}
      />
      <Arm key={`z+${k}`} arm="z+" cells={zCells} target={scene.dims >= 3 ? 1 : 0} {...common} big={false} />
      <Label
        position={big ? [0, -0.05, 0.62] : [-0.32, 0, 0.32]}
        className={`axis-label axis-origin ${big ? "is-big" : ""}`}
      >
        {formatNumber(0, lang)}
      </Label>
    </group>
  );
}
