import { type Page, expect, test } from "@playwright/test";

/**
 * Spielt das komplette Tutorial durch (Zeitraffer mit ?fast) und prüft dabei die wichtigsten Lernhilfen:
 * gezielte Hinweise bei typischen Fehlern, Sprachwechsel mit Schulschreibweise und gespeicherten Fortschritt.
 */

async function freshStart(page: Page, lang: "de" | "en" = "de") {
  await page.goto("/?fast");
  await page.evaluate((l) => {
    localStorage.setItem(
      "understand-3d",
      JSON.stringify({
        state: { lang: l, calm: false, unlockAll: false, progress: {}, name: "" },
        version: 1,
      }),
    );
  }, lang);
  await page.reload();
}

async function skipIntro(page: Page) {
  await page.getByTestId("intro-skip").click();
}

async function point(page: Page, values: (number | string)[]) {
  // Während Kubi läuft, sind die Felder gesperrt – erst weitertippen, wenn er angekommen ist.
  await expect(page.getByTestId("go")).toBeEnabled();
  const axes = ["x", "y", "z"];
  for (const [i, v] of values.entries()) await page.getByTestId(`input-${axes[i] ?? "x"}`).fill(String(v));
  await page.getByTestId("go").click();
}

/** Zahlenfeld wie in Tinkercad: anklicken, tippen, Enter. */
async function field(page: Page, name: string, value: number) {
  const input = page.getByTestId(`field-${name}`);
  await input.click();
  await input.fill(String(value));
  await input.press("Enter");
}

async function finishMission(page: Page) {
  await expect(page.getByTestId("success")).toBeVisible();
  await page.getByTestId("next").click();
}

async function nextChapter(page: Page) {
  await expect(page.getByTestId("chapter-card")).toBeVisible();
  await page.getByTestId("chapter-next").click();
}

test("komplettes Tutorial mit Kubi durchspielen", async ({ page }) => {
  await freshStart(page);
  await expect(page.getByText("Hallo! Ich bin Kubi.", { exact: false })).toBeVisible();
  await page.getByTestId("start").click();
  await expect(page.getByTestId("map-1.2")).toBeDisabled();
  await page.getByTestId("map-1.1").click();

  // Kapitel 1 – Zahlengerade
  await page.getByTestId("intro-next").click();
  await skipIntro(page);
  await point(page, [6]);
  await finishMission(page);

  await skipIntro(page);
  await point(page, [4]);
  await expect(page.getByTestId("speech")).toContainText("Vorzeichen");
  await point(page, [-4]);
  await finishMission(page);

  await skipIntro(page);
  await point(page, [5]);
  await expect(page.getByTestId("speech")).toContainText("nächste");
  await point(page, [-3]);
  await finishMission(page);
  await nextChapter(page);

  // Kapitel 2 – Ebene
  await skipIntro(page);
  await point(page, [4, 3]);
  await expect(page.getByTestId("speech")).toContainText("vertauscht");
  await point(page, [3, 4]);
  await finishMission(page);

  await skipIntro(page);
  await point(page, [2, 5]);
  await finishMission(page);

  await skipIntro(page);
  await point(page, [-4, 3]);
  await point(page, [2, -5]);
  await point(page, [-3, -2]);
  await finishMission(page);

  await skipIntro(page);
  await field(page, "x", -2);
  await field(page, "y", 1);
  await field(page, "w", 5);
  await field(page, "d", 3);
  await page.getByTestId("check").click();
  await finishMission(page);
  await nextChapter(page);

  // Kapitel 3 – Raum
  await skipIntro(page);
  await point(page, [2, 3, 0]);
  await expect(page.getByTestId("speech")).toContainText("Höhe z vergessen");
  await point(page, [2, 3, 4]);
  await finishMission(page);

  await skipIntro(page);
  await page.getByTestId("view-front").click();
  await point(page, [-3, 2, 5]);
  await finishMission(page);

  await skipIntro(page);
  await point(page, [4, -2, 3]);
  await point(page, [-5, -4, 1]);
  await point(page, [0, 5, 6]);
  await finishMission(page);
  await nextChapter(page);

  // Kapitel 4 – Körper & Größen
  await skipIntro(page);
  await page.getByTestId("add-box").click();
  await field(page, "w", 16);
  await field(page, "d", 16);
  await field(page, "h", 16);
  await page.getByTestId("check").click();
  await finishMission(page);

  await skipIntro(page);
  await field(page, "x", -20);
  await field(page, "y", -10);
  await page.getByTestId("check").click();
  await expect(page.getByTestId("speech")).toContainText("steckt in der anderen");
  await field(page, "z", 10);
  await page.getByTestId("check").click();
  await finishMission(page);

  await skipIntro(page);
  await field(page, "x", 30);
  await field(page, "y", 20);
  await field(page, "z", 10);
  await page.getByTestId("check").click();
  await expect(page.getByTestId("speech")).toContainText("Mitte eingetragen");
  await page.getByTestId("ruler-center").click();
  await field(page, "x", 30);
  await field(page, "y", 20);
  await page.getByTestId("check").click();
  await finishMission(page);
  await nextChapter(page);

  // Kapitel 5 – Tinkercad-Werkzeuge
  await skipIntro(page);
  await page.getByTestId("tool-ruler").click();
  await page.getByTestId("ruler-spot-0").click();
  await field(page, "x", 10);
  await field(page, "y", 10);
  await field(page, "z", 30);
  await page.getByTestId("check").click();
  await finishMission(page);

  await skipIntro(page);
  await page.getByTestId("tool-align").click();
  await page.getByTestId("align-x-mid").click();
  await page.getByTestId("align-y-mid").click();
  await page.getByTestId("check").click();
  await finishMission(page);

  await skipIntro(page);
  await expect(page.getByTestId("blueprint")).toBeVisible();
  await page.getByTestId("add-box").click();
  for (const [f, v] of [
    ["w", 5],
    ["d", 20],
    ["h", 20],
    ["x", 25],
    ["y", -10],
  ] as const)
    await field(page, f, v);
  await page.getByTestId("add-box").click();
  for (const [f, v] of [
    ["w", 60],
    ["d", 20],
    ["h", 5],
    ["x", -30],
    ["y", -10],
    ["z", 20],
  ] as const)
    await field(page, f, v);
  await page.getByTestId("check").click();
  await finishMission(page);
  await nextChapter(page);

  // Urkunde und Spickzettel
  await expect(page.getByTestId("certificate")).toBeVisible();
  await page.getByTestId("tab-cheat").click();
  await expect(page.getByTestId("cheatsheet")).toContainText("Lineal");

  // Fortschritt überlebt einen Neustart des Browsers.
  await page.reload();
  await page.getByTestId("start").click();
  await expect(page.getByTestId("map-5.3")).toBeEnabled();
  await expect(page.getByTestId("to-certificate")).toBeVisible();
});

test("Sprache umschalten: Texte und Schreibweise der Koordinaten", async ({ page }) => {
  await freshStart(page, "de");
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("unlock-all").check();
  await page.keyboard.press("Escape");
  await page.getByTestId("start").click();
  await page.getByTestId("map-2.1").click();
  await skipIntro(page);
  await expect(page.getByTestId("goal-card")).toContainText("(3 | 4)");
  await page.getByTestId("lang-en").click();
  await expect(page.getByTestId("goal-card")).toContainText("(3, 4)");
  await expect(page.getByTestId("goal-card")).toContainText("Bring Kubi");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Hilfe in drei Stufen: Hinweis, Hilfslinien, Zeig's mir", async ({ page }) => {
  await freshStart(page, "de");
  await page.getByTestId("start").click();
  await page.getByTestId("map-1.1").click();
  await skipIntro(page);
  await point(page, [1]);
  await expect(page.getByTestId("show-me")).toHaveCount(0);
  await point(page, [2]);
  await expect(page.getByTestId("speech")).toContainText("Hilfslinien");
  await point(page, [3]);
  await page.getByTestId("show-me").click();
  await expect(page.getByTestId("input-x")).toHaveValue("6");
  await page.getByTestId("go").click();
  await expect(page.getByTestId("success")).toBeVisible();
  // Nach drei Fehlversuchen gibt es noch einen Stern – geschafft ist geschafft.
  await expect(page.locator('.success-stars[aria-label="1 von 3 Sternen"]')).toBeVisible();
});
