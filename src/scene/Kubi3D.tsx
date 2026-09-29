import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group, Mesh } from "three";

import { speedFactor } from "@/app/motion";
import { usePlay } from "@/app/play";
import { useLang, useSettings } from "@/app/settings";
import { type Axis, ORIGIN, type Vec3, equals, toScene, vec } from "@/domain/coords";
import { formatNumber } from "@/i18n/format";

import { AXIS_COLOR, KUBI } from "./colors";
import { Label } from "./Label";
import { clamp, damp, dampAngle } from "./tween";
import { liveAngles } from "./view";

type Mode = "idle" | "poofOut" | "poofIn" | "walk";

interface CountLabel {
  id: number;
  position: [number, number, number];
  text: string;
  axis: Axis;
}

const SEGMENT_AXES: Axis[] = ["x", "y", "z"];

interface AnimState {
  mode: Mode;
  seq: number;
  path: Vec3[];
  seg: number;
  dist: number;
  t: number;
  pos: Vec3;
  yaw: number;
  time: number;
  errorAt: number;
  successAt: number;
  nextBlink: number;
  labelId: number;
  trail: [number, number, number];
  missionId: string;
}

/** Der Bauroboter Kubi – dasselbe Design wie das SVG-Maskottchen, aus einfachen Grundkörpern. */
function KubiModel({
  propeller,
  happy,
  eyesRef,
  propRef,
}: {
  propeller: boolean;
  happy: boolean;
  eyesRef: React.RefObject<Group | null>;
  propRef: React.RefObject<Group | null>;
}) {
  return (
    <group>
      {/* Füße */}
      {[-0.14, 0.14].map((x) => (
        <RoundedBox key={x} args={[0.16, 0.08, 0.22]} radius={0.03} position={[x, 0.04, 0.02]}>
          <meshStandardMaterial color={KUBI.feet} roughness={0.6} />
        </RoundedBox>
      ))}
      {/* Körper */}
      <RoundedBox args={[0.62, 0.58, 0.54]} radius={0.12} smoothness={4} position={[0, 0.38, 0]}>
        <meshStandardMaterial color={KUBI.body} roughness={0.45} />
      </RoundedBox>
      {/* Arme */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.08, 0.22, 0.14]}
          radius={0.035}
          position={[side * 0.35, 0.34, 0]}
          rotation={[0, 0, side * 0.18]}
        >
          <meshStandardMaterial color={KUBI.bodyDark} roughness={0.5} />
        </RoundedBox>
      ))}
      {/* Bildschirm-Gesicht */}
      <RoundedBox args={[0.46, 0.32, 0.04]} radius={0.06} position={[0, 0.42, 0.26]}>
        <meshStandardMaterial color={KUBI.screen} roughness={0.3} />
      </RoundedBox>
      <group ref={eyesRef} position={[0, 0.45, 0.285]}>
        {[-0.1, 0.1].map((x) =>
          happy ? (
            <mesh key={x} position={[x, -0.02, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.05, 0.016, 8, 16, Math.PI]} />
              <meshStandardMaterial color={KUBI.eye} emissive={KUBI.eye} emissiveIntensity={0.6} />
            </mesh>
          ) : (
            <mesh key={x} position={[x, 0, 0]} scale={[0.055, 0.075, 0.02]}>
              <sphereGeometry args={[1, 20, 16]} />
              <meshStandardMaterial color={KUBI.eye} emissive={KUBI.eye} emissiveIntensity={0.6} />
            </mesh>
          ),
        )}
      </group>
      {/* Lächeln */}
      <mesh position={[0, 0.36, 0.285]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.05, 0.013, 8, 16, Math.PI]} />
        <meshStandardMaterial color={KUBI.eye} emissive={KUBI.eye} emissiveIntensity={0.5} />
      </mesh>
      {/* Wangen */}
      {[-0.19, 0.19].map((x) => (
        <mesh key={x} position={[x, 0.34, 0.272]} scale={[0.035, 0.022, 0.01]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={KUBI.cheek} roughness={0.6} />
        </mesh>
      ))}
      {/* Antenne oder Propeller */}
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
        <meshStandardMaterial color={KUBI.feet} />
      </mesh>
      {propeller ? (
        <group ref={propRef} position={[0, 0.82, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 16]} />
            <meshStandardMaterial color={KUBI.antenna} />
          </mesh>
          {[0, Math.PI].map((r) => (
            <mesh key={r} rotation={[0, r, 0]} position={[Math.cos(r) * 0.2, 0.01, -Math.sin(r) * 0.2]}>
              <boxGeometry args={[0.36, 0.015, 0.08]} />
              <meshStandardMaterial color="#4dabf7" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, 0.84, 0]}>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color={KUBI.antenna} emissive={KUBI.antenna} emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function TrailBar({ barRef, axis }: { barRef: React.RefObject<Mesh | null>; axis: Axis }) {
  return (
    <mesh ref={barRef} visible={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={AXIS_COLOR[axis]}
        transparent
        opacity={0.8}
        roughness={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Kubi in der Szene. Bei „Los!“ startet er am Ursprung und läuft erst entlang x, dann y, dann fliegt er
 * entlang z. Zählt dabei die Schritte mit und hinterlässt eine farbige Spur – so wird sichtbar, dass jede
 * Koordinate ein Weg vom Ursprung aus ist.
 */
export function Kubi3D() {
  const mission = usePlay((s) => s.mission);
  const scene = usePlay((s) => s.scene);
  const kubiPos = usePlay((s) => s.kubiPos);
  const kubiPath = usePlay((s) => s.kubiPath);
  const pathSeq = usePlay((s) => s.pathSeq);
  const phase = usePlay((s) => s.phase);
  const lastError = usePlay((s) => s.lastError);
  const calm = useSettings((s) => s.calm);
  const lang = useLang();
  const unit = scene.unit;
  const dims = scene.dims;

  const root = useRef<Group>(null);
  const yawGroup = useRef<Group>(null);
  const leanGroup = useRef<Group>(null);
  const body = useRef<Group>(null);
  const eyes = useRef<Group>(null);
  const prop = useRef<Group>(null);
  const shadow = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const barX = useRef<Mesh>(null);
  const barY = useRef<Mesh>(null);
  const barZ = useRef<Mesh>(null);
  const [counts, setCounts] = useState<CountLabel[]>([]);

  const anim = useRef<AnimState>({
    mode: "idle",
    seq: -1,
    path: [],
    seg: 0,
    dist: 0,
    t: 0,
    pos: kubiPos,
    yaw: 0,
    time: 0,
    errorAt: -10,
    successAt: -10,
    nextBlink: 2,
    labelId: 0,
    trail: [0, 0, 0],
    missionId: "",
  });

  useEffect(() => {
    if (lastError) anim.current.errorAt = anim.current.time;
  }, [lastError]);

  useEffect(() => {
    if (phase === "success") anim.current.successAt = anim.current.time;
  }, [phase]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const a = anim.current;
    a.time += dt;
    const speed = speedFactor(calm);

    // Neue Mission: Spur und Zahlen verschwinden, Kubi steht am Start.
    const missionId = mission?.id ?? "";
    if (a.missionId !== missionId || (!kubiPath && a.mode !== "idle" && a.path.length === 0)) {
      a.missionId = missionId;
      a.mode = "idle";
      a.path = [];
      a.trail = [0, 0, 0];
      a.pos = kubiPos;
      a.seq = pathSeq;
      setCounts([]);
    }

    if (kubiPath && a.seq !== pathSeq) {
      a.seq = pathSeq;
      a.path = kubiPath;
      a.seg = 0;
      a.dist = 0;
      a.t = 0;
      a.trail = [0, 0, 0];
      a.mode = equals(a.pos, ORIGIN) ? "walk" : "poofOut";
      setCounts([]);
    }

    let hop = 0;
    let scale = 1;
    let moving = false;
    let targetYaw = liveAngles.theta;

    if (a.mode === "idle" && !kubiPath && !equals(a.pos, kubiPos)) a.pos = kubiPos;

    if (a.mode === "poofOut" || a.mode === "poofIn") {
      a.t += dt * 5 * speed;
      scale = a.mode === "poofOut" ? Math.max(0, 1 - a.t) : Math.min(1, a.t);
      if (a.t >= 1) {
        a.t = 0;
        if (a.mode === "poofOut") {
          a.pos = ORIGIN;
          a.mode = "poofIn";
        } else {
          a.mode = "walk";
        }
      }
    } else if (a.mode === "walk") {
      moving = true;
      let from = a.path[a.seg];
      let to = a.path[a.seg + 1];
      // Wege der Länge 0 (z. B. x = 0) überspringen.
      while (from && to && equals(from, to)) {
        a.seg += 1;
        from = a.path[a.seg];
        to = a.path[a.seg + 1];
      }
      if (!from || !to) {
        a.mode = "idle";
        usePlay.getState().arrive();
      } else {
        const axis = SEGMENT_AXES[Math.min(a.seg, 2)] ?? "x";
        const len = Math.abs(to[axis] - from[axis]);
        const dir = Math.sign(to[axis] - from[axis]);
        const before = a.dist;
        const stepsPerSecond = len > 6 ? 4.6 : 3.4;
        a.dist = Math.min(len, a.dist + dt * stepsPerSecond * speed);
        const newLabels: CountLabel[] = [];
        for (let k = Math.floor(before + 1e-6) + 1; k <= Math.floor(a.dist + 1e-6); k++) {
          const p = { ...from, [axis]: from[axis] + dir * k };
          const [sx, sy, sz] = toScene(p, unit);
          a.labelId += 1;
          // Zählzahlen neben dem Weg: auf der Zahlengeraden darüber, in der Ebene seitlich versetzt.
          const offset: [number, number, number] =
            dims === 1
              ? [0, 1.05, 0]
              : axis === "x"
                ? [0, 0.3, -0.5]
                : axis === "y"
                  ? [0.5, 0.3, 0]
                  : [0.5, 0, 0];
          newLabels.push({
            id: a.labelId,
            axis,
            position: [sx + offset[0], sy + offset[1], sz + offset[2]],
            text: formatNumber(p[axis], lang),
          });
        }
        if (newLabels.length) setCounts((c) => [...c, ...newLabels]);
        a.trail[Math.min(a.seg, 2) as 0 | 1 | 2] = a.dist * dir;
        a.pos = { ...from, [axis]: from[axis] + dir * a.dist };
        if (axis !== "z") {
          hop = Math.abs(Math.sin(a.dist * Math.PI)) * 0.22;
          targetYaw = axis === "x" ? (dir > 0 ? Math.PI / 2 : -Math.PI / 2) : dir > 0 ? Math.PI : 0;
        }
        if (a.dist >= len - 1e-6) {
          a.seg += 1;
          a.dist = 0;
        }
      }
    }

    // Freuen und Grübeln
    const sinceSuccess = a.time - a.successAt;
    const sinceError = a.time - a.errorAt;
    let spin = 0;
    if (phase === "success" && sinceSuccess < 2.2) {
      hop = Math.abs(Math.sin(sinceSuccess * 7)) * 0.4;
      spin = sinceSuccess < 1.2 ? sinceSuccess * Math.PI * 1.7 : 0;
    }
    const tilt =
      sinceError < 2 && phase === "play" ? Math.sin(sinceError * 5) * 0.2 * (1 - sinceError / 2) : 0;

    const [x, y, z] = toScene(a.pos, unit);
    const flying = a.pos.z > 0;
    const bob = Math.sin(a.time * 2.2) * (flying ? 0.05 : 0.015);
    root.current?.position.set(x, y + hop + (moving ? 0 : bob), z);
    // Von oben wirkt Kubi kleiner – dann etwas größer zeichnen.
    root.current?.scale.setScalar(scale * (liveAngles.phi > 1.2 ? 1.2 : 0.95));
    a.yaw = dampAngle(a.yaw, targetYaw, 8, dt);
    if (yawGroup.current) yawGroup.current.rotation.y = a.yaw + spin;
    const lean = clamp((liveAngles.phi - 0.75) * 0.6, 0, 0.42);
    if (leanGroup.current) leanGroup.current.rotation.x = damp(leanGroup.current.rotation.x, -lean, 6, dt);
    if (body.current) body.current.rotation.z = tilt;
    if (prop.current) prop.current.rotation.y += dt * (moving || flying ? 26 : 5);

    // Blinzeln
    if (a.time > a.nextBlink) {
      const bt = a.time - a.nextBlink;
      const open = bt < 0.14 ? 0.15 : 1;
      eyes.current?.scale.set(1, open, 1);
      if (bt > 0.14) a.nextBlink = a.time + 2.5 + Math.random() * 2.5;
    }

    if (shadow.current) {
      shadow.current.position.set(x, 0.004, z);
      const h = Math.max(0, y + hop);
      shadow.current.scale.setScalar(scale * Math.max(0.35, 1 - h * 0.08));
    }
    if (ring.current) {
      ring.current.position.set(x, 0.01, z);
      ring.current.visible = mission?.type !== "build" && a.mode === "idle";
    }
    // Spur: x-, y- und z-Abschnitt
    const origin = a.path[0] ?? ORIGIN;
    const [tx, ty, tz] = a.trail;
    const segments: [Mesh | null, Axis, Vec3, number][] = [
      [barX.current, "x", origin, tx],
      [barY.current, "y", vec(origin.x + tx, origin.y, 0), ty],
      [barZ.current, "z", vec(origin.x + tx, origin.y + ty, 0), tz],
    ];
    for (const [mesh, axis, start, length] of segments) {
      if (!mesh) continue;
      const len = Math.abs(length) * (unit === "mm" ? 0.1 : 1);
      mesh.visible = len > 0.01;
      const half = { ...start, [axis]: start[axis] + length / 2 };
      const [bx, by, bz] = toScene(half, unit);
      mesh.position.set(bx, axis === "z" ? by : 0.1, bz);
      mesh.scale.set(axis === "x" ? len : 0.2, axis === "z" ? len : 0.2, axis === "y" ? len : 0.2);
    }
  });

  return (
    <group>
      <group ref={root}>
        <group ref={yawGroup}>
          <group ref={leanGroup}>
            <group ref={body}>
              <KubiModel
                propeller={scene.dims === 3}
                happy={phase === "success"}
                eyesRef={eyes}
                propRef={prop}
              />
            </group>
          </group>
        </group>
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#1b2a3a" transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.44, 32]} />
        <meshBasicMaterial color="#1c7ed6" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      <TrailBar barRef={barX} axis="x" />
      <TrailBar barRef={barY} axis="y" />
      <TrailBar barRef={barZ} axis="z" />
      {counts.map((c) => (
        <Label key={c.id} position={c.position} className={`count-label axis-${c.axis}`}>
          {c.text}
        </Label>
      ))}
    </group>
  );
}
