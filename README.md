# Understand 3D

Ein kindgerechtes Tutorial, das Koordinatensysteme von Grund auf erklärt – als Vorbereitung auf das
Modellieren mit **Tinkercad**. Zielgruppe sind Schülerinnen und Schüler ab Klasse 5, auch ohne Vorwissen
zu Koordinaten oder negativen Zahlen. Begleitet werden sie vom Bauroboter **Kubi**.

- 16 Missionen in 5 Kapiteln, ein Durchlauf dauert etwa **45 Minuten**
- Deutsch und Englisch, jederzeit umschaltbar
- nur für den Desktop (Maus und großer Bildschirm, wie Tinkercad)
- keine Anmeldung, kein Backend, keine externen Aufrufe: Der Fortschritt bleibt im Browser (`localStorage`)

## Idee: didaktische Reduktion mit Blick auf Tinkercad

In Tinkercad positioniert man mit dem **Lineal** (Koordinaten), den **Zahlenfeldern an den Anfassern**
(Maße) und dem Werkzeug **Ausrichten**. Understand 3D reduziert Tinkercad auf genau diese Ideen und
**schränkt bewusst ein**: Nichts lässt sich frei ziehen, alles geschieht über Zahlen.

| Kapitel           | Inhalt                                                 | Brücke zu Tinkercad                    |
| ----------------- | ------------------------------------------------------ | -------------------------------------- |
| 1 Zahlengerade    | Ursprung, Richtung, Einheit, negative Zahlen           | jede Achse ist eine Zahlengerade       |
| 2 Ebene           | (x \| y), vier Viertel, Fläche = Ecke + Breite + Tiefe | die blaue Arbeitsebene                 |
| 3 Raum            | (x \| y \| z), Ansichtswürfel, Kamera drehen           | z = Höhe über der Arbeitsebene         |
| 4 Körper & Größen | Millimeter, Maße eintippen, Stapeln, Kante oder Mitte  | Zahlenfelder an der Form, Lineal-Modus |
| 5 Werkzeuge       | Lineal umsetzen, Ausrichten, Meisterstück nach Bauplan | Lineal, Ausrichten, Grundformen        |

Alles spielt in **einer Szene, die mitwächst**: Aus der Zahlengeraden wird die Ebene, die Kamera kippt in den
Raum, und in Kapitel 4 werden aus „1, 2, 3 Kästchen“ „10, 20, 30 mm“. Kubi läuft jede Koordinate als Weg ab –
erst x, dann y, dann z – und zählt dabei mit. Bei typischen Denkfehlern (x/y vertauscht, Vorzeichen,
z vergessen, Mitte statt Ecke, Kiste steckt in der anderen …) gibt Kubi einen gezielten Hinweis, nach dem
zweiten Fehlversuch Hilfslinien und nach dem dritten „Zeig's mir“. Details: [`docs/didaktik.md`](docs/didaktik.md).

## Für Lehrkräfte

- Unter **Einstellungen → Für Lehrkräfte** lassen sich alle Missionen freischalten (z. B. für einen
  Einstieg in Kapitel 4) und der Fortschritt zurücksetzen.
- **Ruhige Animationen** verkürzt Übergänge (wird bei „Bewegung reduzieren“ im Betriebssystem automatisch
  gesetzt).
- Am Ende gibt es eine druckbare **Urkunde** und einen **Tinkercad-Spickzettel**.

## Entwicklung

Voraussetzung: Node.js ≥ 22.12 und pnpm (über `corepack enable`).

```bash
pnpm install
pnpm dev            # http://127.0.0.1:5173
pnpm lint && pnpm typecheck && pnpm test
pnpm build && pnpm preview
pnpm test:e2e       # spielt das ganze Tutorial im Browser durch (Playwright/Chromium)
```

Mit `?fast` in der Adresse laufen alle Animationen im Zeitraffer (für Tests und zum schnellen Durchklicken).

Technik: Vite, React 19, TypeScript (strict), three.js mit @react-three/fiber, zustand, motion.
Architektur und Invarianten: [`AGENTS.md`](AGENTS.md).

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Actions auf GitHub Pages
(`.github/workflows/pages.yml`). Einmalig muss im Repository unter **Settings → Pages → Source**
„GitHub Actions“ ausgewählt werden. Der Build liegt danach unter `https://<nutzer>.github.io/Understand-3D/`.

Für einen Schulserver genügt `pnpm build` mit passender Basis, z. B. `PAGES_BASE=/understand3d/ pnpm build`,
und das Kopieren des Ordners `dist/`.

---

Tinkercad ist eine Marke von Autodesk, Inc. Understand 3D ist ein unabhängiges Lernprojekt, nicht mit Autodesk
verbunden und verwendet keine Tinkercad-Grafiken; die Oberfläche ist lediglich an Tinkercad angelehnt.
