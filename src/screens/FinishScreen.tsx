import { useState } from "react";

import { useNav } from "@/app/nav";
import { totalStars, useLang, useSettings, useT } from "@/app/settings";
import type { MessageKey } from "@/i18n";
import { KubiMascot } from "@/mascot/Kubi";
import { MISSIONS } from "@/missions/data";

import { IconMap, IconPrint, Star } from "@/ui/Icons";

const CHEAT: MessageKey[] = [
  "cheat.1",
  "cheat.2",
  "cheat.3",
  "cheat.4",
  "cheat.5",
  "cheat.6",
  "cheat.7",
  "cheat.8",
];

export function FinishScreen() {
  const [tab, setTab] = useState<"certificate" | "cheat">("certificate");
  const name = useSettings((s) => s.name);
  const setName = useSettings((s) => s.setName);
  const progress = useSettings((s) => s.progress);
  const go = useNav((s) => s.go);
  const lang = useLang();
  const t = useT();
  const date = new Date().toLocaleDateString(lang === "de" ? "de-DE" : "en-GB");
  return (
    <main className="finish-screen">
      <div className="finish-tabs no-print" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "certificate"}
          className={tab === "certificate" ? "is-on" : ""}
          onClick={() => setTab("certificate")}
        >
          {t("finish.certificate")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "cheat"}
          className={tab === "cheat" ? "is-on" : ""}
          onClick={() => setTab("cheat")}
          data-testid="tab-cheat"
        >
          {t("finish.cheatSheet")}
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost" onClick={() => go("map")}>
          <IconMap /> {t("ui.toMap")}
        </button>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          <IconPrint /> {t("finish.print")}
        </button>
      </div>
      {tab === "certificate" ? (
        <section className="certificate printable" data-testid="certificate">
          <div className="certificate-inner">
            <KubiMascot mood="happy" size={120} propeller />
            <h1>{t("finish.title")}</h1>
            <label className="certificate-name">
              <span className="sr-only">{t("finish.name")}</span>
              <input
                type="text"
                value={name}
                placeholder={t("finish.namePlaceholder")}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </label>
            <p>{t("finish.line1")}</p>
            <p>{t("finish.line2")}</p>
            <div className="certificate-stars">
              <Star filled size={30} /> {totalStars(progress)} / {MISSIONS.length * 3}
            </div>
            <div className="certificate-foot">
              <span>
                {t("finish.date")}: {date}
              </span>
              <span className="signature">{t("finish.signed")}</span>
            </div>
          </div>
        </section>
      ) : (
        <section className="cheatsheet printable" data-testid="cheatsheet">
          <h1>{t("cheat.title")}</h1>
          <ol>
            {CHEAT.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ol>
          <p className="cheat-foot">Understand 3D · {t("app.trademark")}</p>
        </section>
      )}
    </main>
  );
}
