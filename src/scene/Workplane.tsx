import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  type LineBasicMaterial,
  type MeshBasicMaterial,
} from "three";

import { speedFactor } from "@/app/motion";
import { usePlay } from "@/app/play";
import { useSettings } from "@/app/settings";

import { WORKPLANE } from "./colors";
import { damp } from "./tween";

function gridGeometry(min: number, max: number, step: number, skip?: number): BufferGeometry {
  const points: number[] = [];
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    const v = min + i * step;
    if (skip && Math.abs(Math.round(v / skip) * skip - v) < 1e-6) continue;
    points.push(v, 0, -min, v, 0, -max);
    points.push(min, 0, -v, max, 0, -v);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(points, 3));
  return g;
}

/**
 * Arbeitsebene wie in Tinkercad: hellblaue Fläche mit Raster. Auf der Zahlengeraden (Kapitel 1) liegt nur
 * ein schmaler „Weg“ unter der x-Achse; ab Kapitel 2 blendet die Ebene ein, ab Kapitel 4 mit mm-Raster.
 */
export function Workplane() {
  const scene = usePlay((s) => s.scene);
  const calm = useSettings((s) => s.calm);
  const cellsMin = scene.unit === "mm" ? scene.min / 10 : scene.min;
  const cellsMax = scene.unit === "mm" ? scene.max / 10 : scene.max;
  const planeMin = Math.min(cellsMin, -cellsMax);
  const size = cellsMax - planeMin;
  const planeOpacity = useRef(scene.dims >= 2 ? 1 : 0);
  const roadOpacity = useRef(scene.dims === 1 ? 1 : 0);
  const minorOpacity = useRef(scene.unit === "mm" ? 1 : 0);
  const planeMat = useRef<MeshBasicMaterial>(null);
  const majorMat = useRef<LineBasicMaterial>(null);
  const borderMat = useRef<LineBasicMaterial>(null);
  const minorMat = useRef<LineBasicMaterial>(null);
  const roadMat = useRef<MeshBasicMaterial>(null);

  const major = useMemo(() => gridGeometry(planeMin, cellsMax, 1), [planeMin, cellsMax]);
  const minor = useMemo(() => gridGeometry(planeMin, cellsMax, 0.1, 1), [planeMin, cellsMax]);
  const border = useMemo(() => {
    const g = new BufferGeometry();
    const a = planeMin;
    const b = cellsMax;
    g.setAttribute(
      "position",
      new Float32BufferAttribute(
        [a, 0, -a, b, 0, -a, b, 0, -a, b, 0, -b, b, 0, -b, a, 0, -b, a, 0, -b, a, 0, -a],
        3,
      ),
    );
    return g;
  }, [planeMin, cellsMax]);

  // Der Weg reicht immer von −8 bis 8: In Mission 1.1 deutet er schon an, dass es links weitergeht.
  const roadMin = -8;
  const roadLength = 16 + 1.2;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const k = 2.2 * speedFactor(calm);
    planeOpacity.current = damp(planeOpacity.current, scene.dims >= 2 ? 1 : 0, k, dt);
    roadOpacity.current = damp(roadOpacity.current, scene.dims === 1 ? 1 : 0, k, dt);
    minorOpacity.current = damp(minorOpacity.current, scene.unit === "mm" ? 1 : 0, k, dt);
    const p = planeOpacity.current;
    if (planeMat.current) {
      planeMat.current.opacity = p;
      planeMat.current.visible = p > 0.01;
    }
    if (majorMat.current) majorMat.current.opacity = p * 0.95;
    if (borderMat.current) borderMat.current.opacity = p;
    if (minorMat.current) minorMat.current.opacity = p * minorOpacity.current * 0.55;
    if (roadMat.current) {
      roadMat.current.opacity = roadOpacity.current;
      roadMat.current.visible = roadOpacity.current > 0.01;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[planeMin + size / 2, -0.012, -(planeMin + size / 2)]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial ref={planeMat} color={WORKPLANE.fill} transparent />
      </mesh>
      <lineSegments geometry={minor} position={[0, -0.006, 0]}>
        <lineBasicMaterial ref={minorMat} color={WORKPLANE.minor} transparent />
      </lineSegments>
      <lineSegments geometry={major} position={[0, -0.004, 0]}>
        <lineBasicMaterial ref={majorMat} color={WORKPLANE.major} transparent />
      </lineSegments>
      <lineSegments geometry={border} position={[0, -0.002, 0]}>
        <lineBasicMaterial ref={borderMat} color={WORKPLANE.border} transparent />
      </lineSegments>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[roadMin - 0.6 + roadLength / 2, -0.01, 0]}>
        <planeGeometry args={[roadLength, 1.1]} />
        <meshBasicMaterial ref={roadMat} color={WORKPLANE.road} transparent />
      </mesh>
    </group>
  );
}
