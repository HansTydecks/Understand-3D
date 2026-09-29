import { motion } from "motion/react";

import { useNav } from "@/app/nav";
import { usePlay } from "@/app/play";
import { allDone, isUnlocked, totalStars, useSettings, useT } from "@/app/settings";
import { KubiMascot } from "@/mascot/Kubi";
import { CHAPTERS, MISSIONS, chapterMissions } from "@/missions/data";

import { IconLock, Star } from "@/ui/Icons";

const CHAPTER_COLORS = ["#e5484d", "#2f9e5b", "#3e63dd", "#f59f00", "#9775fa"];

export function MapScreen() {
  const progress = useSettings((s) => s.progress);
  const unlockAll = useSettings((s) => s.unlockAll);
  const calm = useSettings((s) => s.calm);
  const go = useNav((s) => s.go);
  const start = usePlay((s) => s.start);
  const t = useT();
  const current = MISSIONS.find((m) => progress[m.id] === undefined)?.id;
  const open = (id: string) => {
    start(id);
    go("mission");
  };
  return (
    <main className="map-screen">
      <div className="map-head">
        <div>
          <h1>{t("map.title")}</h1>
          <p>{t("map.subtitle")}</p>
        </div>
        <div className="map-total">
          <Star filled size={30} />
          <span>{t("map.stars", { n: totalStars(progress), total: MISSIONS.length * 3 })}</span>
          {allDone(progress) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => go("finish")}
              data-testid="to-certificate"
            >
              {t("map.certificate")}
            </button>
          )}
        </div>
      </div>
      <div className="map-chapters">
        {CHAPTERS.map((chapter, ci) => (
          <motion.section
            key={chapter.id}
            className="map-chapter"
            style={{ ["--chapter" as string]: CHAPTER_COLORS[ci] }}
            initial={calm ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.07 }}
          >
            <header>
              <span className="map-chapter-no">{t("map.chapter", { n: chapter.id })}</span>
              <h2>{t(chapter.title)}</h2>
            </header>
            <ol>
              {chapterMissions(chapter.id).map((m) => {
                const unlocked = isUnlocked(m.id, progress, unlockAll);
                const stars = progress[m.id] ?? 0;
                const isCurrent = m.id === current;
                return (
                  <li key={m.id} className={isCurrent ? "is-current" : ""}>
                    <button
                      type="button"
                      className="map-mission"
                      disabled={!unlocked}
                      onClick={() => open(m.id)}
                      aria-label={t("map.mission", { id: m.id, title: t(m.title) })}
                      data-testid={`map-${m.id}`}
                    >
                      <span className="map-node">{unlocked ? m.id : <IconLock />}</span>
                      <span className="map-mission-text">
                        <span className="map-mission-title">{unlocked ? t(m.title) : t("map.locked")}</span>
                        <span className="map-stars" aria-hidden="true">
                          {[1, 2, 3].map((n) => (
                            <Star key={n} filled={n <= stars} size={16} />
                          ))}
                        </span>
                      </span>
                    </button>
                    {isCurrent && (
                      <span className="map-kubi" aria-hidden="true">
                        <KubiMascot mood="point" size={48} />
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </motion.section>
        ))}
      </div>
    </main>
  );
}
