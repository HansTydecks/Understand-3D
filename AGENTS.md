# AGENTS.md – Invarianten für Understand 3D

Lies zuerst `README.md` und `docs/didaktik.md`.

## Nicht verhandelbar

1. **Nur Zahlen, kein Ziehen.** Formen und Kubi werden ausschließlich über Zahlenfelder, Ausrichten-Punkte
   und das Lineal bewegt. Kamera drehen ist erlaubt (ab Mission 3.3), Objekte ziehen nie.
2. **Tinkercad-Konvention im Fachkern.** x rechts, y nach hinten, z nach oben; Position = Ecke mit den kleinsten
   Werten, im Lineal-Modus „Mitte“ der Mittelpunkt (x/y), z immer Höhe über der Arbeitsebene. Umrechnung nach
   three.js nur in `src/domain/coords.ts` (`toScene`).
3. **Auswertung ist rein und getestet.** `src/domain/evaluate.ts` erkennt typische Fehler (`ErrorKind`). Neue
   Fehlerart = Test + Hinweistext in beiden Sprachen.
4. **Jeder Text in beiden Sprachen.** Neue Schlüssel in `src/i18n/de.ts`, `en.ts` wird dagegen typgeprüft.
   Koordinaten: DE `(3 | 4)`, EN `(3, 4)`. Leseniveau Klasse 5, Du-Form.
5. **Keine externen Requests, kein Tracking, keine Cookies.** Schriften werden mitgebündelt, Fortschritt nur
   im `localStorage`.
6. **Keine Tinkercad-Assets** (Logos, Screenshots). Anlehnung an die Bedienung, eigene Gestaltung.
7. **Ruhige Animationen respektieren** (`calm`, `prefers-reduced-motion`) und `?fast` für Tests erhalten.

## Aufbau

- `src/domain/` – Koordinaten, Geometrie (Lineal, Ausrichten), Auswertung
- `src/missions/` – Missionen als reine Daten (`data.ts`), Typen (`types.ts`)
- `src/app/` – Zustand: `settings.ts` (persistiert), `play.ts` (Missionsablauf), `nav.ts`
- `src/scene/` – three.js-Szene (Achsen, Arbeitsebene, Kubi, Formen) und `overlay.tsx` (HTML an 3D-Punkten)
- `src/ui/`, `src/screens/`, `src/mascot/` – Oberfläche im Tinkercad-Stil, Maskottchen Kubi (SVG)

## Befehle

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
PW_CHROMIUM_PATH=/pfad/zu/chrome pnpm test:e2e   # optional eigener Chromium
```
