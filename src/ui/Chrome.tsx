import { useEffect, useRef, useState } from "react";

import { useNav } from "@/app/nav";
import { usePlay } from "@/app/play";
import { totalStars, useSettings, useT } from "@/app/settings";
import type { Lang } from "@/i18n";
import { MISSIONS } from "@/missions/data";

import { IconClose, IconGear, IconMap, Star } from "./Icons";

export function Logo() {
  return (
    <span className="logo">
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <rect x="4" y="8" width="32" height="28" rx="8" fill="#ff8a3d" />
        <rect x="9" y="13" width="22" height="16" rx="5" fill="#243b53" />
        <rect x="13" y="17" width="4" height="7" rx="2" fill="#6ef0ff" />
        <rect x="23" y="17" width="4" height="7" rx="2" fill="#6ef0ff" />
        <circle cx="20" cy="5" r="3.5" fill="#ffd23f" />
      </svg>
      <span className="logo-word">Understand</span>
      <span className="logo-3d">3D</span>
    </span>
  );
}

export function LangToggle() {
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const t = useT();
  const option = (value: Lang, label: string) => (
    <button
      type="button"
      className={lang === value ? "is-on" : ""}
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      data-testid={`lang-${value}`}
    >
      {label}
    </button>
  );
  return (
    <div className="segmented lang-toggle" role="group" aria-label={t("nav.language")}>
      {option("de", "DE")}
      {option("en", "EN")}
    </div>
  );
}

export function TopBar({ onSettings }: { onSettings: () => void }) {
  const screen = useNav((s) => s.screen);
  const go = useNav((s) => s.go);
  const mission = usePlay((s) => s.mission);
  const progress = useSettings((s) => s.progress);
  const t = useT();
  return (
    <header className="topbar">
      <button type="button" className="topbar-home" onClick={() => go("start")} aria-label={t("app.title")}>
        <Logo />
      </button>
      <div className="topbar-center">
        {screen === "mission" && mission && (
          <span className="topbar-mission">
            <em>{t("ui.mission", { id: mission.id })}</em> {t(mission.title)}
          </span>
        )}
      </div>
      <div className="topbar-right">
        <span
          className="topbar-stars"
          title={t("map.stars", { n: totalStars(progress), total: MISSIONS.length * 3 })}
        >
          <Star filled size={20} /> {totalStars(progress)}
        </span>
        <LangToggle />
        {screen !== "map" && (
          <button
            type="button"
            className="btn btn-ghost btn-small"
            onClick={() => go("map")}
            data-testid="nav-map"
          >
            <IconMap /> {t("nav.map")}
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={onSettings}
          aria-label={t("nav.settings")}
          title={t("nav.settings")}
          data-testid="nav-settings"
        >
          <IconGear />
        </button>
      </div>
    </header>
  );
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const calm = useSettings((s) => s.calm);
  const unlockAll = useSettings((s) => s.unlockAll);
  const setCalm = useSettings((s) => s.setCalm);
  const setUnlockAll = useSettings((s) => s.setUnlockAll);
  const reset = useSettings((s) => s.reset);
  const go = useNav((s) => s.go);
  const [confirm, setConfirm] = useState(false);
  const t = useT();
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      data-testid="settings"
    >
      <div className="overlay-card settings-card">
        <div className="settings-head">
          <h2 id="settings-title">{t("settings.title")}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label={t("ui.close")}
            ref={closeBtn}
          >
            <IconClose />
          </button>
        </div>
        <div className="settings-row">
          <span>{t("nav.language")}</span>
          <LangToggle />
        </div>
        <label className="settings-row">
          <span>
            {t("settings.motion")}
            <small>{t("settings.motionHint")}</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={calm}
            onChange={(e) => setCalm(e.target.checked)}
          />
        </label>
        <h3>{t("settings.teacher")}</h3>
        <label className="settings-row">
          <span>{t("settings.unlockAll")}</span>
          <input
            type="checkbox"
            className="switch"
            checked={unlockAll}
            onChange={(e) => setUnlockAll(e.target.checked)}
            data-testid="unlock-all"
          />
        </label>
        {!confirm ? (
          <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirm(true)}>
            {t("settings.reset")}
          </button>
        ) : (
          <div className="confirm">
            <p>{t("settings.resetConfirm")}</p>
            <div className="overlay-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)}>
                {t("settings.cancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  reset();
                  setConfirm(false);
                  onClose();
                  go("start");
                }}
              >
                {t("settings.resetYes")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Nur Desktop: Auf kleinen Bildschirmen erscheint ein freundlicher Hinweis. */
export function SmallScreenNotice() {
  const [small, setSmall] = useState(() => window.innerWidth < 1024);
  const t = useT();
  useEffect(() => {
    const onResize = () => setSmall(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (!small) return null;
  return (
    <div className="small-notice" role="alert">
      <div>
        <Logo />
        <h2>{t("small.title")}</h2>
        <p>{t("small.text")}</p>
      </div>
    </div>
  );
}
