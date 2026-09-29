import { motion } from "motion/react";
import { useEffect, useRef } from "react";

/** Fokus auf den Hauptknopf, sobald ein Dialog erscheint (statt autoFocus). */
function useFocusOnMount() {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

import { FAST } from "@/app/motion";
import { useNav } from "@/app/nav";
import { usePlay } from "@/app/play";
import { useSettings, useT } from "@/app/settings";
import type { MessageKey } from "@/i18n";
import { KubiMascot } from "@/mascot/Kubi";
import { CHAPTERS, MISSIONS, missionIndex } from "@/missions/data";

import { IconArrowRight, IconMap, IconRestart, Star } from "./Icons";

const CONFETTI_COLORS = ["#ff8a3d", "#4dabf7", "#51cf66", "#ffc53d", "#e5484d", "#9775fa"];

/** Kleines Konfetti auf einer Leinwand – keine Bibliothek, respektiert „Ruhige Animationen“. */
export function Confetti({ seq }: { seq: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const calm = useSettings((s) => s.calm);
  useEffect(() => {
    const c = canvas.current;
    if (!c || calm || FAST) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = (c.width = c.clientWidth);
    const h = (c.height = c.clientHeight);
    const parts = Array.from({ length: 140 }, () => ({
      x: w / 2 + (Math.random() - 0.5) * 120,
      y: h * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 15 - 5,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: 6 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)] ?? "#ffc53d",
    }));
    let frame = 0;
    let id = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.vy += 0.42;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 150);
        ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (frame < 150) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [seq, calm]);
  return <canvas ref={canvas} className="confetti" aria-hidden="true" />;
}

/** Nach einer geschafften Mission: Sterne, Kubi freut sich, weiter geht's. */
export function SuccessOverlay() {
  const mission = usePlay((s) => s.mission);
  const phase = usePlay((s) => s.phase);
  const successSeq = usePlay((s) => s.successSeq);
  const chapterCard = useNav((s) => s.chapterCard);
  if (!mission || phase !== "success" || chapterCard !== null) return null;
  return <SuccessCard key={successSeq} />;
}

function SuccessCard() {
  const mission = usePlay((s) => s.mission);
  const stars = usePlay((s) => s.stars);
  const successSeq = usePlay((s) => s.successSeq);
  const start = usePlay((s) => s.start);
  const go = useNav((s) => s.go);
  const showChapterCard = useNav((s) => s.showChapterCard);
  const calm = useSettings((s) => s.calm);
  const t = useT();
  const focusRef = useFocusOnMount();
  if (!mission) return null;
  const next = MISSIONS[missionIndex(mission.id) + 1];
  const onNext = () => {
    if (!next || next.chapter !== mission.chapter) {
      showChapterCard(mission.chapter);
      return;
    }
    start(next.id);
  };
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
      data-testid="success"
    >
      <Confetti seq={successSeq} />
      <motion.div
        className="overlay-card success-card"
        initial={calm ? false : { scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <KubiMascot mood="happy" size={130} propeller={mission.scene.dims === 3} />
        <h2 id="success-title">{t("success.title")}</h2>
        <div className="success-stars" aria-label={t("success.stars", { n: stars })}>
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              initial={calm ? false : { scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.25 + n * 0.18, type: "spring", stiffness: 400, damping: 12 }}
            >
              <Star filled={n <= stars} size={54} />
            </motion.span>
          ))}
        </div>
        <p className="success-text">{t(mission.success)}</p>
        <div className="overlay-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => start(mission.id)}
            data-testid="again"
          >
            <IconRestart /> {t("ui.again")}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-big"
            onClick={onNext}
            data-testid="next"
            ref={focusRef}
          >
            {t("ui.next")} <IconArrowRight />
          </button>
        </div>
      </motion.div>
      <button type="button" className="overlay-map" onClick={() => go("map")}>
        <IconMap /> {t("ui.toMap")}
      </button>
    </div>
  );
}

/** Kleine Zeichnungen für die Karte „So ist das in Tinkercad“. */
function ChapterArt({ chapter, frontLabel }: { chapter: number; frontLabel: string }) {
  const grid = (
    <g stroke="#9fc1e6" strokeWidth="1">
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i}>
          <line x1={40 + i * 20} y1="20" x2={40 + i * 20} y2="180" />
          <line x1="40" y1={20 + i * 20} x2="200" y2={20 + i * 20} />
        </g>
      ))}
    </g>
  );
  const ruler = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0h70v10H10v-60H0z" fill="#f8f9fa" stroke="#495057" strokeWidth="1.5" />
      <circle cx="5" cy="5" r="6" fill="#1c7ed6" />
    </g>
  );
  switch (chapter) {
    case 1:
      return (
        <svg viewBox="0 0 240 200" className="chapter-art" aria-hidden="true">
          <line x1="10" y1="110" x2="228" y2="110" stroke="#e5484d" strokeWidth="5" />
          <path d="M228 102l12 8-12 8z" fill="#e5484d" />
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line x1={20 + i * 20} y1="100" x2={20 + i * 20} y2="120" stroke="#e5484d" strokeWidth="2" />
              <text x={20 + i * 20} y="140" textAnchor="middle" fontSize="12" fill="#253041">
                {i - 5 < 0 ? `−${5 - i}` : i - 5}
              </text>
            </g>
          ))}
          {ruler(113, 80)}
        </svg>
      );
    case 2:
      return (
        <svg viewBox="0 0 240 200" className="chapter-art" aria-hidden="true">
          <rect x="40" y="20" width="160" height="160" fill="#e6f0fb" />
          {grid}
          <line x1="120" y1="100" x2="212" y2="100" stroke="#e5484d" strokeWidth="4" />
          <line x1="120" y1="100" x2="120" y2="10" stroke="#2f9e5b" strokeWidth="4" />
          <text x="216" y="96" fontSize="16" fontWeight="800" fill="#e5484d">
            x
          </text>
          <text x="126" y="16" fontSize="16" fontWeight="800" fill="#2f9e5b">
            y
          </text>
          <rect x="140" y="40" width="40" height="40" fill="#e5534b" opacity="0.85" />
        </svg>
      );
    case 3:
      return (
        <svg viewBox="0 0 240 200" className="chapter-art" aria-hidden="true">
          <path d="M20 140l100-50 100 50-100 50z" fill="#e6f0fb" stroke="#5f97d6" />
          <line x1="120" y1="140" x2="190" y2="175" stroke="#e5484d" strokeWidth="4" />
          <line x1="120" y1="140" x2="190" y2="105" stroke="#2f9e5b" strokeWidth="4" />
          <line x1="120" y1="140" x2="120" y2="40" stroke="#3e63dd" strokeWidth="4" />
          <text x="112" y="34" fontSize="16" fontWeight="800" fill="#3e63dd">
            z
          </text>
          <g transform="translate(18 18)">
            <rect width="44" height="44" rx="6" fill="#fff" stroke="#8a96a3" />
            <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="700" fill="#495057">
              {frontLabel}
            </text>
          </g>
        </svg>
      );
    case 4:
      return (
        <svg viewBox="0 0 240 200" className="chapter-art" aria-hidden="true">
          <path d="M60 80l60-30 60 30v60l-60 30-60-30z" fill="#e5534b" />
          <path d="M60 80l60 30 60-30-60-30z" fill="#f28079" />
          <path d="M120 110v60l60-30V80z" fill="#c43f37" />
          <line x1="52" y1="152" x2="112" y2="182" stroke="#495057" strokeWidth="2" />
          <rect x="54" y="160" width="40" height="22" rx="3" fill="#fff" stroke="#1c7ed6" strokeWidth="2" />
          <text x="74" y="176" textAnchor="middle" fontSize="13" fontWeight="700" fill="#253041">
            20
          </text>
          <text x="196" y="40" fontSize="15" fontWeight="800" fill="#1c7ed6">
            mm
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 240 200" className="chapter-art" aria-hidden="true">
          <rect x="30" y="20" width="180" height="160" fill="#e6f0fb" />
          {grid}
          <rect x="60" y="90" width="120" height="30" fill="#adb5bd" />
          <rect x="104" y="80" width="32" height="50" fill="#4dabf7" opacity="0.9" />
          {[60, 120, 180].map((x) => (
            <circle key={x} cx={x} cy="140" r="6" fill="#222" />
          ))}
          {ruler(50, 160)}
        </svg>
      );
  }
}

/** Nach dem letzten Auftrag eines Kapitels: die Brücke zu Tinkercad. */
export function ChapterCard() {
  const chapterId = useNav((s) => s.chapterCard);
  const showChapterCard = useNav((s) => s.showChapterCard);
  const go = useNav((s) => s.go);
  const start = usePlay((s) => s.start);
  const calm = useSettings((s) => s.calm);
  const t = useT();
  const focusRef = useFocusOnMount();
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) return null;
  const nextMission = MISSIONS.find((m) => m.chapter === chapter.id + 1);
  const onNext = () => {
    showChapterCard(null);
    if (nextMission) start(nextMission.id);
    else go("finish");
  };
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-title"
      data-testid="chapter-card"
    >
      <motion.div
        className="overlay-card chapter-card"
        initial={calm ? false : { scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <p className="chapter-done">{t("chapter.done", { n: chapter.id })}</p>
        <h2 id="chapter-title">{t("chapter.tcTitle")}</h2>
        <div className="chapter-body">
          <ChapterArt chapter={chapter.id} frontLabel={t("view.front")} />
          <ul className="tc-list">
            {chapter.tinkercad.map((key: MessageKey) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </div>
        <div className="overlay-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              showChapterCard(null);
              go("map");
            }}
          >
            <IconMap /> {t("ui.toMap")}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-big"
            onClick={onNext}
            data-testid="chapter-next"
            ref={focusRef}
          >
            {t("ui.next")} <IconArrowRight />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
