import { Canvas } from "@react-three/fiber";

import { usePlay } from "@/app/play";

import { Axes } from "./Axes";
import { BuildWorld } from "./BuildWorld";
import { CameraRig } from "./CameraRig";
import { Kubi3D } from "./Kubi3D";
import { OverlayProjector } from "./overlay";
import { PointWorld } from "./PointWorld";
import { Workplane } from "./Workplane";

/** Eine einzige Szene für alle Kapitel: Sie wächst von der Zahlengeraden bis zum Raum mit Körpern. */
export function Stage() {
  const orbit = usePlay((s) => s.mission?.tools.orbit ?? false);
  return (
    <Canvas
      className="stage-canvas"
      data-testid="stage"
      camera={{ fov: 24, near: 0.1, far: 800, position: [0, 6, 30] }}
      dpr={[1, 2]}
      flat
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    >
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#ffffff", "#b9c7d6", 0.55]} />
      <directionalLight position={[6, 14, 9]} intensity={1.25} />
      <directionalLight position={[-8, 6, -4]} intensity={0.35} />
      <CameraRig orbit={orbit} />
      <Workplane />
      <Axes />
      <PointWorld />
      <BuildWorld />
      <Kubi3D />
      <OverlayProjector />
    </Canvas>
  );
}
