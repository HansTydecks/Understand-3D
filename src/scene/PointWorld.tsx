import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ExtrudeGeometry, type Group, Shape as ThreeShape } from "three";

import { speedFactor } from "@/app/motion";
import { currentReadIndex, helpVisible, pointTargets, usePlay } from "@/app/play";
import { useSettings } from "@/app/settings";
import { type Vec3, toScene, vec } from "@/domain/coords";
import type { ItemKind } from "@/missions/types";

import { AXIS_COLOR } from "./colors";
import { damp } from "./tween";

/** Punktierte Linie aus kleinen Kugeln – gut sichtbar, anders als 1-Pixel-WebGL-Linien. */
export function DottedLine({
  from,
  to,
  color,
  gap = 0.22,
}: {
  from: Vec3;
  to: Vec3;
  color: string;
  gap?: number;
}) {
  const scene = usePlay((s) => s.scene);
  const points = useMemo(() => {
    const a = toScene(from, scene.unit);
    const b = toScene(to, scene.unit);
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.floor(len / gap));
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [
        number,
        number,
        number,
      ];
    });
  }, [from, to, scene.unit, gap]);
  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function starGeometry(): ExtrudeGeometry {
  const shape = new ThreeShape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.36 : 0.16;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const g = new ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.03,
  });
  g.center();
  return g;
}

function ItemModel({ kind, glow }: { kind: ItemKind; glow: boolean }) {
  const star = useMemo(() => (kind === "star" ? starGeometry() : null), [kind]);
  const e = glow ? 0.55 : 0.12;
  if (kind === "crystal") {
    return (
      <mesh scale={[0.24, 0.34, 0.24]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#7c5cff"
          emissive="#9b87ff"
          emissiveIntensity={e}
          roughness={0.25}
          flatShading
        />
      </mesh>
    );
  }
  if (kind === "star" && star) {
    return (
      <mesh geometry={star}>
        <meshStandardMaterial color="#ffc53d" emissive="#ffb300" emissiveIntensity={e} roughness={0.35} />
      </mesh>
    );
  }
  if (kind === "balloon") {
    return (
      <group>
        <mesh scale={[0.3, 0.36, 0.3]} position={[0, 0.12, 0]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial
            color="#ff5c7a"
            emissive="#ff5c7a"
            emissiveIntensity={e * 0.6}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <coneGeometry args={[0.05, 0.08, 10]} />
          <meshStandardMaterial color="#e03e5c" />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.56, 0.3, 0.38]} />
        <meshStandardMaterial
          color="#b0703c"
          emissive="#ffb300"
          emissiveIntensity={e * 0.3}
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.56, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#c98547" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0.2]}>
        <boxGeometry args={[0.1, 0.12, 0.03]} />
        <meshStandardMaterial color="#ffd43b" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Ein Ding an einem Punkt: schwebt über dem Punkt (1D/2D) oder genau am Punkt (3D, mit Lot zum Boden). */
function Item({
  pos,
  kind,
  collected,
  current,
  dims,
}: {
  pos: Vec3;
  kind: ItemKind;
  collected: boolean;
  current: boolean;
  dims: number;
}) {
  const scene = usePlay((s) => s.scene);
  const calm = useSettings((s) => s.calm);
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const vanish = useRef(collected ? 1 : 0);
  // Unterschiedliche Startphase je Ding, damit nicht alle im Gleichtakt wippen.
  const time = useRef(Math.abs(pos.x * 1.7 + pos.y * 2.3 + pos.z * 0.9));
  const [x, y, z] = toScene(pos, scene.unit);
  const hover = dims === 3 ? 0 : 0.55;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    time.current += dt;
    vanish.current = damp(vanish.current, collected ? 1 : 0, 3 * speedFactor(calm), dt);
    const v = vanish.current;
    const g = group.current;
    if (g) {
      g.position.set(x, y + hover + Math.sin(time.current * 2) * 0.05 + v * 1.4, z);
      g.rotation.y =
        kind === "balloon" ? Math.sin(time.current) * 0.2 : time.current * (kind === "star" ? 1.4 : 0.9);
      g.scale.setScalar(Math.max(0.0001, (1 - v) * (current ? 1 + Math.sin(time.current * 5) * 0.08 : 1)));
      g.visible = v < 0.98;
    }
    if (ring.current) {
      ring.current.visible = !collected;
      const s = current ? 1 + Math.sin(time.current * 4) * 0.12 : 1;
      ring.current.scale.set(s, 1, s);
    }
  });

  return (
    <group>
      <group ref={group}>
        <ItemModel kind={kind} glow={current} />
      </group>
      <group ref={ring} position={[x, 0.012, z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 28]} />
          <meshBasicMaterial
            color={current ? "#7c5cff" : "#9aa7b5"}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.07, 16]} />
          <meshBasicMaterial color={current ? "#7c5cff" : "#9aa7b5"} depthWrite={false} />
        </mesh>
      </group>
      {dims === 3 && !collected && <DottedLine from={pos} to={vec(pos.x, pos.y, 0)} color="#7c8a99" />}
    </group>
  );
}

/** Hilfslinien nach dem zweiten Fehlversuch: vom Ziel zu den Achsen – ohne die Zahl zu verraten. */
function Guides({ target, dims }: { target: Vec3; dims: number }) {
  const ground = vec(target.x, target.y, 0);
  return (
    <group>
      {dims === 1 && (
        <DottedLine from={vec(target.x, 0, 0)} to={vec(target.x, -0.9, 0)} color={AXIS_COLOR.x} />
      )}
      {dims >= 2 && (
        <>
          <DottedLine from={ground} to={vec(target.x, 0, 0)} color={AXIS_COLOR.x} />
          <DottedLine from={ground} to={vec(0, target.y, 0)} color={AXIS_COLOR.y} />
        </>
      )}
      {dims === 3 && <DottedLine from={target} to={vec(0, 0, target.z)} color={AXIS_COLOR.z} />}
    </group>
  );
}

export function PointWorld() {
  const mission = usePlay((s) => s.mission);
  const collected = usePlay((s) => s.collected);
  const mistakes = usePlay((s) => s.mistakes);
  const phase = usePlay((s) => s.phase);
  if (!mission || mission.type === "build") return null;
  const dims = mission.scene.dims;
  const targets = pointTargets(mission);
  const readIndex = currentReadIndex(collected);
  const kindAt = (i: number): ItemKind =>
    mission.type === "goto" ? mission.item : (mission.items[i]?.kind ?? "crystal");
  const guideIndex = mission.type === "read" ? readIndex : collected.findIndex((c) => !c);
  const guideTarget = targets[guideIndex];
  return (
    <group>
      {targets.map((t, i) => (
        <Item
          key={`${mission.id}-${i}`}
          pos={t}
          kind={kindAt(i)}
          collected={collected[i] ?? false}
          current={mission.type === "read" ? i === readIndex : !collected[i]}
          dims={dims}
        />
      ))}
      {helpVisible(mistakes) && phase !== "success" && guideTarget && (
        <Guides target={guideTarget} dims={dims} />
      )}
    </group>
  );
}
