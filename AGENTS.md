# Murmel: Anweisungen für Agenten

Gilt für jeden Agenten, der an diesem Repository arbeitet (Claude Code, ChatGPT/Codex und andere).
`CLAUDE.md` verweist nur hierher; Änderungen gehören in diese Datei.

## Was das ist

Murmel ist ein ruhiges Spiel für das iPad, gebaut als Webseite: Glasmurmeln liegen durcheinander auf Papier,
man rollt sie Gruppe für Gruppe an ihren Platz, und ein Bild entsteht.
Öffentlich unter <https://tillhess.github.io/murmel/>.

## Sprache

- Antworten an den Auftraggeber, Commit-Nachrichten, Kommentare, Testnamen und Dokumentation sind Deutsch.
  Bezeichner im Code sind Englisch.
- Das Spiel spricht fünf Sprachen: Englisch, Deutsch, Italienisch, Französisch, Spanisch. Deutsch ist die
  Ausgangssprache. Kein Text für Spieler steht fest im Code oder nur in `index.html`: Jeder neue Text bekommt einen
  Schlüssel in `src/app/texts/de.ts` und im selben Commit eine Übersetzung in allen vier anderen Wörterbüchern
  (`en.ts`, `it.ts`, `fr.ts`, `es.ts`), sonst scheitert die Typprüfung. Ein neues Motiv braucht `scene_<Kennung>`.
  Gelesen wird mit `t('schluessel')` aus `src/app/i18n.ts`, feste Texte der Seite tragen `data-t`.
- Ton in jeder Sprache: ruhig, knapp, ohne Ausrufezeichen, vertraute Anrede (du, you, tu, tu, tú). Das Spiel heißt
  überall „Murmel“.
- Im Spiel und in der Dokumentation heißt es „Murmel“, „Holzbrett“ (die Ablage), „Mulde“ (Platz auf dem Brett),
  „Loch“ oder „leeres Feld“ (freier Platz im Bild), „Sammlung“ (Startseite). Diese Wörter beibehalten. Die
  Entsprechungen der anderen Sprachen stehen oben in jedem Wörterbuch und bleiben ebenso einheitlich.

## Regeln, die nicht ohne den Auftraggeber geändert werden

- **Spielregeln und Bedienung** stehen in `docs/entscheidungen.md`, Bildsprache, Klang und Bewegung in
  `docs/art-direction.md`. Beides ist verbindlich. Wer eine Regel ändern will, fragt zuerst. Ein Fehler in der
  Umsetzung einer Regel darf behoben werden, die Regel selbst nicht.
- **Reine Meditation:** keine Punkte, Züge, Zeit, Sterne, Münzen, Bestenlisten, Bewertungen, Zugvorschläge oder
  sonst etwas, das Wettbewerb oder Druck hineinbringt.
- **Nichts von fremden Servern:** keine Schriften, Skripte, Bilder oder Messdienste von außen. Alles liegt im
  Repository; `scripts/live-pruefen.mjs` prüft das an der ausgelieferten Seite.
- **Alles bleibt auf dem Gerät:** Spielstände und eigene Fotos liegen nur im Speicher des Browsers.
- Jede neue Entscheidung des Auftraggebers kommt mit Datum und Begründung in `docs/entscheidungen.md`, im selben
  Commit wie die Änderung.

## Befehle

Node 26 (siehe `.node-version`). Wo `fnm` installiert ist, steht vor jedem Befehl `fnm exec --using=26`.

| Befehl                          | Was er tut                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                   | Entwicklungsserver auf Port 5173                                                  |
| `npm run check`                 | Lint und Format (Biome), Typprüfung, Tests der Spiellogik (Vitest)                |
| `npm run format`                | behebt, was Biome selbst beheben kann                                             |
| `npm run build`                 | baut `dist/index.html` (öffentliche Seite) und `dist/artifact.html` (Einzeldatei) |
| `npm run e2e`                   | Browsertests (Playwright) in Chromium und in WebKit im iPad-Format                |
| `node scripts/live-pruefen.mjs` | prüft die ausgelieferte öffentliche Seite                                         |

Die Browsertests laufen gegen den Build in `dist/`, nicht gegen die Quelldateien: **vor `npm run e2e` immer
`npm run build`**, sonst prüfen sie den alten Stand.

## Aufbau

- `src/core/`: Spiellogik ohne Browser (Raster, Züge, Auswahl, Farben, Fotos zu Rastern). Jede Datei hat Tests
  daneben (`*.test.ts`). Neue Logik gehört hierher und bekommt Tests.
- `src/app/`: Oberfläche (Sammlung, Spielbildschirm, Zeichnen auf Canvas, Einstellungen, Speicher, Installation).
- `src/art/`: Zeichnen von Murmeln, leeren Feldern, Motiven. `src/audio/`: Klang.
- `e2e/murmel.spec.ts`: Browsertests. Sie bedienen das Spiel über `window.murmel` (siehe Ende von
  `src/app/app.ts`); neue Auskünfte für Tests kommen dort dazu.
- `public/`: Icons, Manifest, Service Worker. `dev/`: Musterblätter für die Entwicklung.
- `docs/`: Entscheidungen und Art Direction. `notizen/`: Recherche.

## Arbeitsweise

- Vor dem Abschluss müssen `npm run check`, `npm run build` und `npm run e2e` grün sein. Was nicht geprüft wurde,
  wird gesagt (zum Beispiel: nicht auf einem echten iPad ausprobiert).
- Sichtbare Änderungen im Browser ansehen, im iPad-Format, bevor sie als fertig gelten.
- Einstellungen brauchen vier Stellen: `src/app/storage.ts` (merken), `src/app/settings.ts` und `index.html`
  (Blatt), `src/app/app.ts` (verdrahten). Eine gespeicherte Wahl, die es nicht mehr gibt, fällt auf die
  Voreinstellung zurück.
- Ein Spielstand passt nur zu dem Raster, mit dem er begonnen wurde. Änderungen an Rastern, an Motiven oder am
  Format in `storage.ts` dürfen vorhandene Stände und eigene Fotos nicht unbrauchbar machen.
- Tests dürfen nicht vom Zufall der Startaufstellung oder von der Geschwindigkeit des Rechners abhängen. Auf dem
  Build-Server ist der iPad-Browser deutlich langsamer als lokal.
- Kommentare erklären, warum etwas so ist, nicht, was die Zeile tut.

## Git und Veröffentlichen

- **Jeder Push auf `main` geht sofort öffentlich** (`.github/workflows/pipeline.yml`: prüfen, bauen, auf GitHub
  Pages ausliefern). Deshalb: auf einem eigenen Zweig arbeiten und nichts auf `main` pushen oder dort
  zusammenführen, auch keinen Pull Request, ohne dass der Auftraggeber es ausdrücklich freigibt.
- Den Zweig vor der Übergabe auf den aktuellen Stand von `main` setzen. Nie mit Gewalt pushen.
- Nach einem Push auf `main` die Pipeline abwarten und die Seite mit `scripts/live-pruefen.mjs` prüfen, bevor
  etwas als veröffentlicht gemeldet wird.
- Commit-Nachrichten: eine deutsche Zeile, die sagt, was sich für den Spieler ändert; Einzelheiten darunter.
- Bleibt lokal und wird nie committet: `notizen/transkript-video.txt`, `entwuerfe/`, Videodateien
  (siehe `.gitignore`).
- Die Git-Einstellungen des Repositorys (Name, E-Mail-Adresse) nicht ändern.
