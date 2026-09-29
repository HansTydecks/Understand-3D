import type { ReactNode } from "react";

const Svg = ({ children, size = 20 }: { children: ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const IconHome = () => (
  <Svg>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </Svg>
);
export const IconPlus = () => (
  <Svg>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconMinus = () => (
  <Svg>
    <path d="M5 12h14" />
  </Svg>
);
export const IconMap = () => (
  <Svg>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
);
export const IconGear = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </Svg>
);
export const IconRuler = () => (
  <Svg>
    <path d="M4 3v17h17" />
    <path d="M4 7h3M4 11h2M4 15h3M8 20v-3M12 20v-2M16 20v-3" />
  </Svg>
);
export const IconAlign = () => (
  <Svg>
    <path d="M12 3v18" />
    <rect x="5" y="6" width="14" height="4" rx="1" />
    <rect x="8" y="14" width="8" height="4" rx="1" />
  </Svg>
);
export const IconTrash = () => (
  <Svg>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </Svg>
);
export const IconBlueprint = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 15h10M7 15v-5M17 15v-5M7 10h10" />
  </Svg>
);
export const IconRestart = () => (
  <Svg>
    <path d="M4 4v6h6" />
    <path d="M20 12a8 8 0 10-2.3 5.7M4 10a8 8 0 012-3.5" />
  </Svg>
);
export const IconPrint = () => (
  <Svg>
    <path d="M6 9V3h12v6" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M7 14h10v7H7z" />
  </Svg>
);
export const IconArrowRight = () => (
  <Svg>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
export const IconCheck = () => (
  <Svg>
    <path d="M5 12l5 5 9-10" />
  </Svg>
);
export const IconLock = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 118 0v3" />
  </Svg>
);
export const IconClose = () => (
  <Svg>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export function Star({ filled, size = 22 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
        fill={filled ? "#ffc53d" : "#e3e7ec"}
        stroke={filled ? "#f59f00" : "#c5ccd4"}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Kleine Formsymbole wie in der Tinkercad-Formenleiste. */
export function ShapeIcon({ kind }: { kind: "box" | "cylinder" }) {
  if (kind === "box") {
    return (
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
        <path d="M10 20l18-9 18 9v18l-18 9-18-9z" fill="#e5534b" />
        <path d="M10 20l18 9 18-9-18-9z" fill="#f28079" />
        <path d="M28 29v18l18-9V20z" fill="#c43f37" />
      </svg>
    );
  }
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      <path d="M11 16v24c0 4 7.6 7 17 7s17-3 17-7V16z" fill="#f59f00" />
      <ellipse cx="28" cy="16" rx="17" ry="7" fill="#ffc34d" />
      <path d="M36 22.2c5-1.2 9-3.4 9-6.2v24c0 2.8-4 5-9 6.2z" fill="#d98c00" />
    </svg>
  );
}
