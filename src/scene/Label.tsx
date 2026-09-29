import type { ReactNode } from "react";

import { Anchor } from "./overlay";

/** Beschriftung im Raum: immer lesbar, gleiche Schrift wie die Oberfläche. */
export function Label({
  position,
  children,
  className = "",
  visible = true,
}: {
  position: [number, number, number];
  children: ReactNode;
  className?: string;
  visible?: boolean;
}) {
  return (
    <Anchor position={position} className={`scene-label ${className} ${visible ? "" : "is-hidden"}`} occlude>
      {children}
    </Anchor>
  );
}
