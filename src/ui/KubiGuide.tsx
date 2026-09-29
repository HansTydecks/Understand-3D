import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { FAST } from "@/app/motion";
import { showMeAvailable, usePlay } from "@/app/play";
import { useLang, useSettings, useT } from "@/app/settings";
import { KubiMascot } from "@/mascot/Kubi";

import { speechText } from "./speech";

/** Schreibmaschinen-Text: freundlich und lesbar im Kindertempo; Klick zeigt sofort alles. */
function useTypewriter(text: string, seq: number, instant: boolean): [string, () => void] {
  const [state, setState] = useState({ seq, count: 0 });
  useEffect(() => {
    if (instant) return;
    const id = window.setInterval(() => {
      setState((s) => {
        const count = s.seq === seq ? s.count : 0;
        if (count >= text.length) {
          window.clearInterval(id);
          return s.seq === seq ? s : { seq, count };
        }
        return { seq, count: count + 2 };
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [text, seq, instant]);
  const count = instant ? text.length : state.seq === seq ? state.count : 0;
  return [text.slice(0, count), () => setState({ seq, count: text.length })];
}

/** Kubi unten links mit Sprechblase: Einführung, Auftrag, Hinweise und „Zeig's mir“. */
export function KubiGuide() {
  const speech = usePlay((s) => s.speech);
  const phase = usePlay((s) => s.phase);
  const mission = usePlay((s) => s.mission);
  const introStep = usePlay((s) => s.introStep);
  const mistakes = usePlay((s) => s.mistakes);
  const dims = usePlay((s) => s.scene.dims);
  const next = usePlay((s) => s.nextIntro);
  const skip = usePlay((s) => s.skipIntro);
  const showMe = usePlay((s) => s.showMe);
  const calm = useSettings((s) => s.calm);
  const lang = useLang();
  const t = useT();
  const text = speech ? speechText(speech, lang) : "";
  const [typed, complete] = useTypewriter(text, speech?.seq ?? 0, calm || FAST);
  const typing = typed.length < text.length;

  useEffect(() => {
    if (phase !== "intro") return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "BUTTON")) return;
      if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, next]);

  if (!mission || phase === "success") return null;
  const mood = !speech
    ? "point"
    : typing && speech.mood !== "think" && speech.mood !== "happy"
      ? "talk"
      : speech.mood;
  const introCount = mission.intro.length;

  return (
    <div className="guide" data-testid="guide">
      <div className="guide-kubi">
        <KubiMascot mood={mood} size={124} propeller={dims === 3} />
      </div>
      <AnimatePresence mode="wait">
        {speech && (
          <motion.div
            key={speech.seq}
            className={`bubble bubble-${speech.mood}`}
            initial={calm ? false : { opacity: 0, scale: 0.85, x: -12 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
          >
            <p className="sr-only" aria-live="polite" data-testid="speech">
              {text}
            </p>
            <button type="button" className="bubble-text" onClick={complete} aria-hidden="true" tabIndex={-1}>
              {typed}
              {typing && <span className="caret" />}
            </button>
            {phase === "intro" && (
              <div className="bubble-actions">
                <span className="intro-dots" aria-hidden="true">
                  {Array.from({ length: introCount }, (_, i) => (
                    <span key={i} className={i <= introStep ? "is-on" : ""} />
                  ))}
                </span>
                <button type="button" className="btn btn-ghost" onClick={skip} data-testid="intro-skip">
                  {t("ui.skipIntro")}
                </button>
                <button type="button" className="btn btn-primary" onClick={next} data-testid="intro-next">
                  {t("ui.next")} ▸
                </button>
              </div>
            )}
            {phase !== "intro" && showMeAvailable(mistakes) && (
              <div className="bubble-actions">
                <button type="button" className="btn btn-secondary" onClick={showMe} data-testid="show-me">
                  {t("ui.showMe")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
