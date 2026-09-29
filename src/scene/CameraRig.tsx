import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";

import { speedFactor } from "@/app/motion";
import { usePlay } from "@/app/play";
import { useSettings } from "@/app/settings";

import { damp, dampAngle } from "./tween";
import { type ViewTarget, presetFor, publishAngles, useView } from "./view";

/**
 * Eigene Kameraführung statt OrbitControls: So lassen sich OBEN-Ansicht (φ = 90°), Kapitelübergänge und
 * Ansichtswürfel ohne Sprünge animieren. Drehen mit gedrückter Maustaste (rechts wie in Tinkercad, links
 * zusätzlich für Touchpads), Zoomen mit dem Mausrad – nur, wenn die Mission es freischaltet.
 */
export function CameraRig({ orbit }: { orbit: boolean }) {
  const { camera, gl, size } = useThree();
  const scene = usePlay((s) => s.scene);
  const calm = useSettings((s) => s.calm);
  const current = useRef<ViewTarget>({
    ...useView.getState().desired,
    target: [...useView.getState().desired.target],
  });
  const orbitRef = useRef(orbit);
  useEffect(() => {
    orbitRef.current = orbit;
  }, [orbit]);

  useEffect(() => {
    useView.getState().setPreset(presetFor(scene));
  }, [scene]);

  useEffect(() => {
    const el = gl.domElement;
    let last: { x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (!orbitRef.current) return;
      last = { x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        useView.getState().orbitBy(-dx * 0.008, dy * 0.008);
        useView.getState().setDragging(true);
      }
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      last = null;
      useView.getState().setDragging(false);
    };
    const wheel = (e: WheelEvent) => {
      if (!orbitRef.current) return;
      e.preventDefault();
      useView.getState().zoomBy(e.deltaY > 0 ? 1.1 : 1 / 1.1);
    };
    const menu = (e: MouseEvent) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const { desired, dragging } = useView.getState();
    const lambda = dragging ? 25 : 2.6 * speedFactor(calm);
    const c = current.current;
    c.theta = dampAngle(c.theta, desired.theta, lambda, dt);
    c.phi = damp(c.phi, desired.phi, lambda, dt);
    c.zoom = damp(c.zoom, desired.zoom, lambda, dt);
    c.fitW = damp(c.fitW, desired.fitW, lambda, dt);
    c.fitH = damp(c.fitH, desired.fitH, lambda, dt);
    c.target = [
      damp(c.target[0], desired.target[0], lambda, dt),
      damp(c.target[1], desired.target[1], lambda, dt),
      damp(c.target[2], desired.target[2], lambda, dt),
    ];
    const cam = camera as PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const tanHalf = Math.tan(((cam.fov / 2) * Math.PI) / 180);
    const distance = Math.max(c.fitW / (tanHalf * aspect), c.fitH / tanHalf) * c.zoom;
    const { theta, phi } = c;
    const [tx, ty, tz] = c.target;
    cam.position.set(
      tx + distance * Math.cos(phi) * Math.sin(theta),
      ty + distance * Math.sin(phi),
      tz + distance * Math.cos(phi) * Math.cos(theta),
    );
    // „Oben“ auf dem Bildschirm: Ableitung der Kameraposition nach φ – auch bei φ = 90° eindeutig.
    cam.up.set(-Math.sin(phi) * Math.sin(theta), Math.cos(phi), -Math.sin(phi) * Math.cos(theta));
    cam.lookAt(tx, ty, tz);
    // Bild etwas nach oben schieben, weil unten Kubi und das Steuerpult liegen.
    const shift = Math.round(size.height * 0.07);
    if (
      cam.view?.offsetY !== shift ||
      cam.view.fullWidth !== size.width ||
      cam.view.fullHeight !== size.height
    ) {
      cam.setViewOffset(size.width, size.height, 0, shift, size.width, size.height);
    }
    publishAngles(theta, phi);
  });

  return null;
}
