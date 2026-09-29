import type { Mood } from "@/app/play";

import "./kubi.css";

/**
 * Maskottchen Kubi als SVG. Die Stimmung steuert CSS-Animationen: wippen und blinzeln (idle), Mund bewegen
 * (talk), springen mit Freudenaugen (happy), Kopf schief mit Fragezeichen (think), winken (wave), zeigen (point).
 */
export function KubiMascot({
  mood = "idle",
  size = 150,
  propeller = false,
}: {
  mood?: Mood;
  size?: number;
  propeller?: boolean;
}) {
  const happy = mood === "happy";
  return (
    <svg
      className={`kubi kubi-${mood}`}
      width={size}
      height={size * 1.1}
      viewBox="0 0 200 220"
      role="img"
      aria-label="Kubi"
    >
      <ellipse className="kubi-shadow" cx="100" cy="208" rx="58" ry="8" />
      <g className="kubi-bounce">
        <g className="kubi-feet">
          <rect x="62" y="182" width="30" height="18" rx="7" fill="#34495e" />
          <rect x="108" y="182" width="30" height="18" rx="7" fill="#34495e" />
        </g>
        <g className="kubi-arm kubi-arm-left">
          <rect x="18" y="112" width="22" height="46" rx="11" fill="#e56f22" />
        </g>
        <g className="kubi-arm kubi-arm-right">
          <rect x="160" y="112" width="22" height="46" rx="11" fill="#e56f22" />
        </g>
        <g className="kubi-head">
          {propeller ? (
            <g className="kubi-propeller">
              <rect x="97" y="30" width="6" height="26" fill="#34495e" />
              <g className="kubi-blades">
                <ellipse cx="100" cy="28" rx="44" ry="7" fill="#4dabf7" />
              </g>
              <circle cx="100" cy="28" r="8" fill="#ffd23f" />
            </g>
          ) : (
            <g className="kubi-antenna">
              <rect x="97" y="30" width="6" height="28" fill="#34495e" />
              <circle cx="100" cy="26" r="11" fill="#ffd23f" />
              <circle cx="96" cy="22" r="3.5" fill="#fff6c9" />
            </g>
          )}
          <rect x="30" y="56" width="140" height="130" rx="30" fill="#ff8a3d" />
          <rect x="30" y="56" width="140" height="42" rx="30" fill="#ffa25f" opacity="0.55" />
          <rect x="44" y="76" width="112" height="80" rx="20" fill="#243b53" />
          <g className="kubi-eyes">
            {happy ? (
              <>
                <path
                  d="M68 118 q12 -18 24 0"
                  stroke="#6ef0ff"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M108 118 q12 -18 24 0"
                  stroke="#6ef0ff"
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <rect className="kubi-eye" x="68" y="98" width="20" height="28" rx="10" fill="#6ef0ff" />
                <rect className="kubi-eye" x="112" y="98" width="20" height="28" rx="10" fill="#6ef0ff" />
                <circle cx="82" cy="106" r="3.5" fill="#ffffff" />
                <circle cx="126" cy="106" r="3.5" fill="#ffffff" />
              </>
            )}
          </g>
          <g className="kubi-mouth">
            {mood === "talk" ? (
              <ellipse className="kubi-mouth-talk" cx="100" cy="140" rx="10" ry="6" fill="#6ef0ff" />
            ) : mood === "think" ? (
              <path d="M90 142 h20" stroke="#6ef0ff" strokeWidth="5" strokeLinecap="round" />
            ) : (
              <path
                d="M86 136 q14 14 28 0"
                stroke="#6ef0ff"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </g>
          <circle cx="42" cy="150" r="9" fill="#ff6b8b" opacity="0.8" />
          <circle cx="158" cy="150" r="9" fill="#ff6b8b" opacity="0.8" />
        </g>
        {mood === "think" && (
          <g className="kubi-question">
            <circle cx="178" cy="46" r="18" fill="#ffffff" stroke="#243b53" strokeWidth="3" />
            <text x="178" y="55" textAnchor="middle" fontSize="26" fontWeight="800" fill="#243b53">
              ?
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
