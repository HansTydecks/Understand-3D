import { motion } from "motion/react";

import { useNav } from "@/app/nav";
import { useSettings, useT } from "@/app/settings";
import { KubiMascot } from "@/mascot/Kubi";

import { LangToggle } from "@/ui/Chrome";

export function StartScreen() {
  const progress = useSettings((s) => s.progress);
  const calm = useSettings((s) => s.calm);
  const go = useNav((s) => s.go);
  const t = useT();
  const started = Object.keys(progress).length > 0;
  return (
    <main className="start-screen">
      <div className="start-grid" aria-hidden="true" />
      <motion.section
        className="start-card"
        initial={calm ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
      >
        <div className="start-kubi">
          <KubiMascot mood="wave" size={210} />
        </div>
        <div className="start-text">
          <h1>
            Understand <span className="logo-3d big">3D</span>
          </h1>
          <p className="tagline">{t("app.tagline")}</p>
          <div className="start-bubble">
            <p>{t("start.hello")}</p>
          </div>
          <div className="start-actions">
            <button
              type="button"
              className="btn btn-primary btn-huge"
              onClick={() => go("map")}
              data-testid="start"
            >
              {started ? t("start.continue") : t("start.play")} ▸
            </button>
            <LangToggle />
          </div>
          <p className="start-meta">{t("start.duration")}</p>
        </div>
      </motion.section>
      <footer className="start-footer">
        <p>{t("app.privacy")}</p>
        <p>{t("app.trademark")}</p>
      </footer>
    </main>
  );
}
