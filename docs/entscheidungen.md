# Entscheidungen

Was für Murmel festgelegt ist und warum. Neue Entscheidungen kommen unten dazu, mit Datum.

## Spielregeln

| Regel | Warum |
| --- | --- |
| Am Anfang liegt keine Murmel auf ihrer Zielfarbe. | Das Bild soll ganz aus dem eigenen Sortieren entstehen. |
| Ein Zug hat zwei Schritte: Gruppe wählen, dann Ziel antippen. | Vom Auftraggeber so festgelegt (14.11.2026). Man entscheidet in Ruhe, statt dass die Murmel sofort springt. |
| Gewählt ist die angetippte Murmel samt allen angrenzenden Murmeln derselben Farbe, die noch falsch liegen. | So bewegt ein Tipp eine ganze Fläche. |
| Ziel ist ein freies Loch derselben Farbe oder die Ablage. | |
| Gefüllt wird nur der zusammenhängende Bereich um das angetippte Loch. Was nicht hineinpasst, bleibt liegen. | Vom Auftraggeber so festgelegt: kein Weiterfließen in andere Löcher. Der Zug tut genau, was man angetippt hat. |
| Es rollen die Murmeln, die dem Ziel am nächsten liegen. | Ergibt kurze, nachvollziehbare Wege. |
| Die Ablage hat 30 feste Mulden. | Vom Auftraggeber festgelegt. Mulden sind feste Plätze, nichts rutscht nach. |
| Es gibt keine Sackgasse. | Liegen Murmeln in der Ablage, gibt es genauso viele freie Löcher, und für mindestens eins passt immer eine Murmel. Das ist als Test abgesichert. |

## Reine Meditation

Kein Zähler, keine Punkte, keine Sterne, keine Bestenliste, keine Münzen, kein Zeitdruck, keine Bewertung von Zügen
(Auftraggeber, 14.11.2026). Das Spiel schlägt auch keine Züge vor. Hinweise in Worten erscheinen nur die ersten beiden
Male und wenn etwas nicht geht.

Der Löser in `src/core/solver.ts` existiert nur für Tests und zum Vorführen.

## Startaufstellung in Flecken

Die Murmeln liegen anfangs in einfarbigen Flecken, jeder Fleck ganz innerhalb eines Bildbereichs. Wird so ein Fleck
bewegt, entsteht ein zusammenhängendes Loch in einer einzigen Farbe, das wieder eine ganze Gruppe aufnehmen kann.
Im früheren Prototyp mit zufälliger Verteilung bewegte ein Zug im Schnitt 1,2 Murmeln.

Gemessen an den fünf Motiven (je fünf Partien des Lösers, Stand 14.11.2026): Eine Gruppe hat anfangs im Schnitt
14 bis 26 Murmeln, ein Zug bewegt 4 bis 5, die größten Züge 19 bis 24. Ein Bild braucht je nach Größe etwa 55
(Mond über dem See) bis 165 Züge (Fuchs im Schnee).

Eine Folge der Regeln: Es gibt immer genau so viele freie Löcher, wie Murmeln in der Ablage liegen. Große Züge
entstehen also erst, wenn vorher bewusst abgelegt wurde. Die Ablage ist der Vorrat für große Züge.

## Farben

Die Palette eines Motivs ist zugleich der Satz seiner Murmelfarben. Zwei Bedingungen, beide als Test:

- Je zwei Farben liegen mindestens ΔE 27 auseinander, damit sie als kleine Glasmurmeln sicher zu unterscheiden sind.
- Keine Farbe belegt mehr als 45 % des Bildes. Mit über 50 % ließe sich nicht mehr jede Murmel auf ein fremdes Feld legen.

Für eigene Fotos gibt es einen festen Satz von 17 Murmelfarben (mindestens ΔE 32 untereinander). Sehr große
Farbflächen eines Fotos werden in hell und dunkel geteilt, sehr kleine der nächsten Farbe zugeschlagen.

Seit dem 14.11.2026 gilt zusätzlich, ebenfalls als Test:

- Bei Rot-Grün-Sehschwäche (nachgebildet nach Machado et al. 2009) bleiben je zwei Farben mindestens ΔE 20
  auseinander. Dafür wurden zwei Paletten geändert: In „Birken im Herbst“ ist das Grün heller und weicher und das
  Orange etwas dunkler, in „Seerosen“ ist das Rosa heller. Vorher lagen dort Paare bei ΔE 9.
- Höchstens eine Farbe je Bild ist kräftig (Buntheit über 60), im Mittel liegt die Buntheit bei höchstens 40. Auch
  der Himmel hinter dem Bild bleibt unter 40; der Himmel der Birken war mit 57 deutlich darüber und ist jetzt gedämpft.

Warum, steht in [art-direction.md](art-direction.md).

## Bewegung und Klang (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Die Kette rollt mit 9 statt 11 Feldern in der Sekunde und rollt auf dem letzten Stück aus. | Ruhiger und mit mehr Gewicht. Weitertippen kann man, während die Kette rollt, es wartet also niemand. |
| Töne werden aufgefächert statt gleichzeitig gespielt. | Rollt eine Kette in einen schmalen Gang, kommen alle Murmeln fast im selben Augenblick zur Ruhe (gemessen: sechs Murmeln in 32 ms). Ohne Auffächern wäre das ein Klangklumpen. |
| Der Hintergrund ist kein Dauerton mehr, sondern einzelne lange Töne im Atemtakt, mit stillen Atemzügen dazwischen. | Musik soll überhörbar sein und Pausen lassen. |
| Klang in drei Stufen: alles, nur Murmeln, still. | Laut Erklärvideo wird neben Hörbüchern gespielt. |
| Der Klang folgt dem Stummmodus des iPad. | Nur so mischt er sich unter ein Hörbuch, statt es zu unterbrechen. Beides zugleich lässt das Web nicht zu. |
| Der Bildschirm wird nicht wach gehalten. | Wer innehält, darf das Gerät einschlafen lassen. Der Stand ist nach jedem Zug gespeichert. |

## Oberfläche (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Auf dem Tablet zeigt die Sammlung alle Bilder auf einmal, im Querformat rechts neben dem Namen. | Vorher stand im Querformat die halbe Seite leer, und man sah nur zwei Bilder. |
| Als App auf dem Home-Bildschirm reicht der Himmel bis unter die Statusleiste (`black-translucent`). | Ein durchgehender Himmel statt eines Balkens. Der Stil wird beim Hinzufügen festgehalten: Wer ihn später ändert, muss die App löschen und neu hinzufügen. |
| Maße der Startseite hängen an der Spielfläche (`cqw`, `cqh`), nicht am Browserfenster (`vh`). | In Home-Bildschirm-Apps meldet iPadOS die Fensterhöhe teils falsch (WebKit-Fehler 316008). |

## Technik

| Entscheidung | Warum |
| --- | --- |
| Web-App mit Canvas, TypeScript, Vite | Läuft sofort auf dem iPad, ohne App Store, und lässt sich als einzelne Datei einbetten. |
| Spielregeln als reine Funktionen in `src/core` | Vollständig testbar ohne Browser. Die Darstellung kann sich ändern, ohne dass Regeln brechen. |
| Motive als Daten (Palette und Formen) | Aus denselben Daten entstehen Murmelraster und Gemälde. Beides passt immer zusammen und ist prüfbar. |
| Klang im Browser erzeugt, keine Audiodateien | Keine Lizenzfragen, keine Ladezeit, und die Einzeldatei bleibt klein. Tonvorrat und Tonfolge sind reine Rechnung (`src/audio/tune.ts`) und damit testbar. |
| Ein Build für zwei Ziele | `dist/index.html` für GitHub Pages, `dist/artifact.html` zum Einbetten. |
| Auslieferung auf GitHub Pages nur nach Schalter | Die Seite wäre öffentlich. Das soll eine bewusste Entscheidung sein. |
