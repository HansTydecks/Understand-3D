import { useFrame } from "@react-three/fiber";
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef } from "react";
import { type Group, type Object3D, Raycaster, Vector3 } from "three";
import { create } from "zustand";

/**
 * Eigene HTML-Ebene über der 3D-Szene: Beschriftungen und Zahlenfelder hängen an Punkten im Raum.
 * Die Szene meldet Anker an, eine einzige DOM-Ebene zeichnet sie, und pro Bild werden nur die
 * Positionen per transform gesetzt. (Robuster und sparsamer als eine eigene React-Wurzel je Label.)
 */
interface OverlayEntry {
  id: string;
  node: ReactNode;
  className: string;
  interactive: boolean;
  z: number;
}

interface OverlayState {
  entries: Record<string, OverlayEntry>;
  upsert: (entry: OverlayEntry) => void;
  remove: (id: string) => void;
}

const useOverlay = create<OverlayState>()((set) => ({
  entries: {},
  upsert: (entry) => set((s) => ({ entries: { ...s.entries, [entry.id]: entry } })),
  remove: (id) =>
    set((s) => ({ entries: Object.fromEntries(Object.entries(s.entries).filter(([key]) => key !== id)) })),
}));

const anchors = new Map<string, Object3D>();
const elements = new Map<string, HTMLDivElement>();
const occludable = new Set<string>();
/** Körper, hinter denen Beschriftungen verblassen (Achsenzahlen sollen nicht auf Formen „kleben“). */
const occluders = new Set<Object3D>();

export function useOccluder(ref: React.RefObject<Object3D | null>): void {
  useEffect(() => {
    const o = ref.current;
    if (!o) return;
    occluders.add(o);
    return () => {
      occluders.delete(o);
    };
  }, [ref]);
}

interface AnchorProps {
  position: [number, number, number];
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  z?: number;
  occlude?: boolean;
}

/** Punkt in der Szene, an dem HTML erscheint. Folgt auch Gruppen-Transformationen (z. B. Wachsen). */
export function Anchor({
  position,
  children,
  className = "",
  interactive = false,
  z = 1,
  occlude = false,
}: AnchorProps) {
  const id = useId();
  const group = useRef<Group>(null);
  const upsert = useOverlay((s) => s.upsert);
  const remove = useOverlay((s) => s.remove);

  useLayoutEffect(() => {
    const g = group.current;
    if (g) anchors.set(id, g);
    if (occlude) occludable.add(id);
    return () => {
      anchors.delete(id);
      occludable.delete(id);
    };
  }, [id, occlude]);

  useEffect(() => {
    upsert({ id, node: children, className, interactive, z });
  }, [id, children, className, interactive, z, upsert]);

  useEffect(() => () => remove(id), [id, remove]);

  return <group ref={group} position={position} />;
}

const visibleChain = (o: Object3D | null): boolean => {
  let node: Object3D | null = o;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
};

/** Rechnet in jedem Bild die Bildschirmposition aller Anker aus. Gehört in den Canvas. */
export function OverlayProjector() {
  const v = useRef(new Vector3());
  const dir = useRef(new Vector3());
  const ray = useRef(new Raycaster());
  useFrame(({ camera, size }) => {
    // Kamera-Matrix dieses Bildes verwenden, nicht die vom letzten Rendern.
    camera.updateMatrixWorld();
    const blockers = [...occluders];
    for (const [id, obj] of anchors) {
      const el = elements.get(id);
      if (!el) continue;
      obj.getWorldPosition(v.current);
      let behind = false;
      if (blockers.length > 0 && occludable.has(id)) {
        dir.current.copy(v.current).sub(camera.position);
        const dist = dir.current.length();
        ray.current.set(camera.position, dir.current.normalize());
        ray.current.far = dist - 0.05;
        behind = ray.current.intersectObjects(blockers, false).length > 0;
      }
      el.style.opacity = behind ? "0.12" : "";
      v.current.project(camera);
      const hidden = v.current.z > 1 || !visibleChain(obj);
      if (hidden) {
        el.style.visibility = "hidden";
        continue;
      }
      const x = ((v.current.x + 1) / 2) * size.width;
      const y = ((1 - v.current.y) / 2) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.visibility = "visible";
    }
  });
  return null;
}

/** Die DOM-Ebene selbst – liegt außerhalb des Canvas genau über ihm. */
export function SceneOverlay() {
  const entries = useOverlay((s) => s.entries);
  return (
    <div className="scene-overlay">
      {Object.values(entries).map((e) => (
        <div
          key={e.id}
          className={`overlay-anchor ${e.interactive ? "is-interactive" : ""}`}
          style={{ zIndex: e.z }}
          ref={(el) => {
            if (el) elements.set(e.id, el);
            else elements.delete(e.id);
          }}
        >
          <div className={`overlay-content ${e.className}`}>{e.node}</div>
        </div>
      ))}
    </div>
  );
}
