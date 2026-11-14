# Murmel

Ein ruhiges Spiel für das iPad. Auf einem Blatt Papier liegen Glasmurmeln durcheinander. Man rollt sie Gruppe für
Gruppe an ihren Platz, und dabei entsteht ein Bild. Es gibt keine Punkte, keine Züge, keine Zeit und keine Bestenliste.

Die Sammlung hat 15 Motive, vom Mond über dem See mit 16 × 16 Murmeln bis zum Koi im Teich mit 32 × 32. Eigene Fotos
kommen als weitere Blätter dazu.

Das Spiel spricht Englisch, Deutsch, Italienisch, Französisch und Spanisch. Es folgt der Sprache des Geräts; in den
Einstellungen lässt sie sich wählen. Die Texte stehen in `src/app/texts/`.

**Spielen:** <https://tillhess.github.io/murmel/>

- Spielregeln und Entscheidungen: [docs/entscheidungen.md](docs/entscheidungen.md)
- Bildsprache, Klang, Bewegung: [docs/art-direction.md](docs/art-direction.md)
- Recherche dazu: [notizen/](notizen/)

## Loslegen

Voraussetzung ist Node 26 (siehe `.node-version`). Mit `fnm` genügt `fnm use` im Projektordner.

```bash
npm install
npm run dev
```

| Befehl           | Was er tut                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev`    | Entwicklungsserver mit sofortigem Neuladen                                                     |
| `npm run check`  | Lint und Format, Typprüfung, Tests der Spiellogik                                              |
| `npm run format` | Formatiert und behebt, was sich automatisch beheben lässt                                      |
| `npm test`       | Tests der Spiellogik (Vitest)                                                                  |
| `npm run build`  | Baut `dist/index.html` (für GitHub Pages) und `dist/artifact.html` (Einzeldatei zum Einbetten) |
| `npm run e2e`    | Browser-Tests gegen den Build, in Chromium und in WebKit im iPad-Format                        |

Vor dem ersten `npm run e2e` einmal die Browser laden: `npx playwright install chromium webkit`.

Unter `dev/szenen.html` (bei laufendem Entwicklungsserver) stehen alle Motive als Gemälde und als Murmelraster
nebeneinander, mit Farbanteilen und kleinstem Farbabstand. `dev/loecher.html` zeigt die Entwürfe für das leere Feld
in jeder Farbe neben der passenden Murmel.

## Aufbau

```
src/core/    Spielregeln als reine Funktionen, ohne Bildschirm: Raster, Startaufstellung, Züge, Kette, Löser,
             Bildausschnitt
src/art/     Motive als Daten und alles Gezeichnete: Papierschnitt, Murmeln, Papier, Holz
src/audio/   Klang, im Browser erzeugt: Tonvorrat und Tonfolge als Rechnung, Wiedergabe über Web Audio
src/app/     Bildschirme und Ablauf: Sammlung, Spiel, Speicherstand
e2e/         Browser-Tests, die das Spiel wie ein Mensch bedienen
dev/         Hilfsseiten für die Entwicklung
scripts/     Build-Helfer (Einzeldatei, Icons)
prototyp/    der frühere Prototyp als einzelne HTML-Datei, nur zum Nachschlagen
```

Die Regeln in `src/core` wissen nichts von Canvas oder DOM. Deshalb lassen sie sich schnell und vollständig testen,
und die Darstellung kann sich ändern, ohne dass eine Regel bricht.

## Ein Motiv hinzufügen

Ein Motiv ist eine Palette und eine Liste übereinanderliegender Formen in `src/art/scenes.ts`. Aus denselben Daten
entstehen das Murmelraster und das gemalte Bild. Die Formen kommen aus `src/core/shapes.ts`: Hügelkette, Band, Wolke,
Blatt, Kuppel, Sichel, ein Band entlang einer Kurve (Zweig, Fischleib) und einige mehr. Die Tests in
`src/art/scenes.test.ts` prüfen für jedes Motiv:

- Die Farben unterscheiden sich klar (ΔE mindestens 27), auch bei Rot-Grün-Sehschwäche (ΔE mindestens 20).
- Höchstens eine Farbe ist kräftig, und der Himmel hinter dem Bild ist gedämpft.
- Jede Farbe belegt mindestens 1,2 % und höchstens 45 % des Bildes.
- Das Bild beginnt ohne eine richtig liegende Murmel und lässt sich lösen, in der gemalten Größe und in jeder
  Detailtiefe von 16 × 16 bis 50 × 50.

Die Liste `SCENES` am Ende der Datei ist nach Größe geordnet: So wächst die Sammlung von leicht nach aufwendig.
`dev/szenen.html` zeigt die Messwerte zu jeder Palette.

## Auf dem iPad

Die Seite in Safari öffnen und über „Teilen“ → „Zum Home-Bildschirm“ hinzufügen. Dann startet Murmel wie eine App
ohne Adressleiste. Der Spielstand liegt auf dem Gerät. In der App löscht iPadOS ihn nicht nach sieben Tagen ohne
Besuch, wie es bei Seiten in Safari vorkommen kann. Ein in Safari begonnenes Bild ist in der App nicht da, weil
beide getrennt speichern.

- **Kein Ton?** Der Klang richtet sich nach dem Stummmodus des iPad (Glocke im Kontrollzentrum). Das ist Absicht:
  Nur so läuft ein Hörbuch ungestört weiter.
- **Einstellungen** (von der Startseite und über das Symbol oben rechts im Spiel): wie leere Felder aussehen,
  Murmeln mit oder ohne Spiegelung, Detailtiefe von 16 × 16 bis 50 × 50 Murmeln, Größe des Holzbretts von 30 bis
  120 Mulden, Klang in drei Stufen.
- **Sammlung:** Die Bilder hängen an einer Wand, drei nebeneinander. Sie ist höher als der Bildschirm: Ein Finger
  schiebt sie nach oben und unten, und ein weicher Auslauf am unteren Rand zeigt, dass es weitergeht. Wer aus einem
  Bild zurückkommt, steht wieder an derselben Stelle.
- **Eigene Bilder:** Das leere Blatt am Ende der Sammlung nimmt ein Foto auf. Es bleibt dort hängen, mit Spielstand,
  bis man es über das kleine Kreuz an seiner Ecke entfernt. Foto und Stand verlassen das Gerät nicht.
- **Vergrößern:** Zwei Finger spreizen das Bild auf, ein Finger verschiebt es. Das Holzbrett bleibt stehen. Das
  Symbol mit den vier Ecken zeigt wieder das ganze Bild.
- Aufnahmen aus WebKit im iPad-Format: `npm run build && npm run preview`, dann in einem zweiten Fenster
  `node scripts/aufnahmen.mjs <Zielordner>`.

Auf einem echten iPad ist das Spiel noch nicht geprüft, siehe „Nicht geprüft“ in
[docs/art-direction.md](docs/art-direction.md).

## Pipeline

`.github/workflows/pipeline.yml` läuft bei jedem Push auf `main` und bei jedem Pull Request:

1. **pruefen**: Lint und Format, Typen, Tests der Spiellogik
2. **bauen**: Build, danach Browser-Tests gegen genau diesen Build. Der Build liegt als Download am Lauf.
3. **ausliefern**: veröffentlicht den Build von `main` auf GitHub Pages und prüft, ob die Seite danach antwortet

Gründlicher prüft `node scripts/live-pruefen.mjs` die ausgelieferte Seite: Es bespielt sie in WebKit im iPad-Format
und meldet, ob etwas von fremden Servern geladen wird.

Die Auslieferung hängt an einem Schalter: Im Repository steht die Variable `PAGES` auf `an` (Settings → Secrets and
variables → Actions → Variables), und unter Settings → Pages ist als Quelle „GitHub Actions“ gewählt. Wer die
Variable löscht oder ändert, hält die Auslieferung an; die Seite bleibt dann auf dem letzten Stand stehen.

Das Repository ist öffentlich, weil GitHub Pages im kostenlosen Tarif kein privates Repository zulässt.

## Schriften

[Fraunces](https://github.com/undercasetype/Fraunces) und [Figtree](https://github.com/erikdkennedy/figtree) stehen
unter der SIL Open Font License 1.1. Sie kommen als Pakete (`@fontsource-variable/…`, Lizenztexte liegen dort bei)
und werden beim Bauen in die Seite eingebettet. Die Seite lädt dadurch nichts von fremden Servern.

## App Store (iOS)

Die iOS-App ist eine dünne Hülle (Capacitor) um denselben Build wie die Webseite. Das Xcode-Projekt liegt in `ios/`.

```bash
npm run ios          # baut dist/ und überträgt es ins iOS-Projekt
npx cap open ios     # öffnet das Projekt in Xcode
```

Voraussetzung ist Xcode aus dem Mac App Store. Zum Veröffentlichen braucht es außerdem eine Mitgliedschaft im
Apple Developer Program; das Team wird in Xcode unter „Signing & Capabilities“ gewählt.

- Kennung der App: `de.tillhess.murmel` (in `capacitor.config.ts` und im Xcode-Projekt)
- Icon und Startbild entstehen aus `public/icon.svg`: `node scripts/icons.mjs`
- Die App ist für das iPad eingestellt und bringt fünf Sprachen mit (`ios/App/App/*.lproj`).
- Texte, Angaben und Screenshots für den Eintrag: [docs/app-store/eintrag.md](docs/app-store/eintrag.md),
  `node scripts/store-aufnahmen.mjs`
- In der App gibt es keinen Service Worker und keinen Knopf „App installieren“; beides gehört nur zur Webseite.
