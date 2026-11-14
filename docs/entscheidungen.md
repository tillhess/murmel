# Entscheidungen

Was für Murmel festgelegt ist und warum. Neue Entscheidungen kommen unten dazu, mit Datum.

## Spielregeln

| Regel | Warum |
| --- | --- |
| Am Anfang liegt keine Murmel auf ihrer Zielfarbe. | Das Bild soll ganz aus dem eigenen Sortieren entstehen. |
| Ein Zug hat zwei Schritte: Gruppe wählen, dann Ziel antippen. | Vom Auftraggeber so festgelegt (14.11.2026). Man entscheidet in Ruhe, statt dass die Murmel sofort springt. |
| Gewählt ist die angetippte Murmel samt allen angrenzenden Murmeln derselben Farbe, die noch falsch liegen. | So bewegt ein Tipp eine ganze Fläche. |
| Ziel ist ein freies Loch derselben Farbe oder die Ablage. | |
| Es gilt überall dasselbe: Eine Murmel antippen heißt wählen, eine freie Stelle antippen heißt dorthin rollen. Auf dem Holzbrett legt ein Tipp auf eine freie Mulde, auf das Holz oder auf eine Murmel derselben Farbe die gewählte Gruppe ab; ein Tipp auf eine Murmel anderer Farbe wechselt zur Auswahl des Holzbretts. | Festgelegt am 14.11.2026 nach einem Fehler: Seit der Rest einer Auswahl gewählt bleibt, galt jeder Tipp aufs Holzbrett als Ablegen. Bei vollem Brett kam man so nicht mehr an die Murmeln darauf heran. Freie Mulden leuchten, solange eine Gruppe gewählt ist. |
| Gefüllt wird nur der zusammenhängende Bereich um das angetippte Loch. Was nicht hineinpasst, bleibt liegen. | Vom Auftraggeber so festgelegt: kein Weiterfließen in andere Löcher. Der Zug tut genau, was man angetippt hat. |
| Bei der Auswahl und beim Ziel zählen auch Verbindungen über Eck. | Vom Auftraggeber so festgelegt (14.11.2026). Die Kette rollt geradeaus, wo es geht, und über Eck nur, wo es sein muss. |
| Was nicht hineinpasst, bleibt gewählt. Das gilt auch, wenn auf dem Holzbrett nicht für alle Platz ist. | Vom Auftraggeber so festgelegt (14.11.2026). Man tippt gleich das nächste Ziel an, statt die Gruppe neu zu wählen. Ein Tipp daneben oder auf den Rest hebt die Auswahl auf. |
| Es rollen die Murmeln, die dem Ziel am nächsten liegen. | Ergibt kurze, nachvollziehbare Wege. |
| Die Ablage hat 30 Mulden, in den Einstellungen wählbar bis 120. | Die 30 hat der Auftraggeber festgelegt, am 14.11.2026 dann die Wahl: Große Bilder brauchen mehr Vorrat. Im laufenden Spiel wächst das Brett sofort; kleiner wird es nur, wenn alle Murmeln darauf noch Platz haben. |
| Ein Tipp auf das Holzbrett wählt alle Farben darauf. Die Murmeln schweben, das Brett bekommt einen hellen Rahmen und passende Löcher leuchten. Ein zweiter Tipp aufs Brett oder ein Tipp daneben hebt die Auswahl auf. Nach einem vollständigen Zug aus dem Bild bleibt alles unmarkiert. | Vom Auftraggeber so festgelegt (14.11.2026), damit sich das Brett schnell verteilen lässt. Eine im Bild gewählte Gruppe hat Vorrang für Löcher ihrer Farbe und bleibt gewählt, wenn ein Loch anderer Farbe vom Brett gefüllt wird. |
| Beim Ablegen ordnet sich das Holzbrett nach Farben: Gleiche Farben liegen lückenlos beieinander, eine neue Farbe kommt hinten an. | Vom Auftraggeber so festgelegt (14.11.2026). Murmeln, die schon lagen, rücken dafür still zusammen. |
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

Die zehn Motive vom 14.11.2026 reihen sich ein (ebenfalls je fünf Partien des Lösers): von etwa 60 Zügen (Segelboot
im Abendlicht, 16 × 16) bis etwa 240 (Koi im Teich, 32 × 32). Ihr Raster ist nicht stärker zerstückelt als das der
ersten fünf: Das unruhigste hat 28 zusammenhängende Flächen (Pilze im Moos), bei den Birken sind es 42.

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

## Leere Felder und Einstellungen (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Für das leere Feld gibt es sechs Entwürfe zur Wahl. Voreingestellt ist „Gestanzt“: ein dunkles Loch mit heller Schnittkante in einem Kragen in der Zielfarbe. | Die ersten dunklen Mulden waren von dunklen Murmeln kaum zu unterscheiden. Von den drei Entwürfen danach (Schälchen, Ring, Gestanzt) ging „Gestanzt“ laut Auftraggeber am besten, die Farben waren ihm aber noch zu wenig zu ahnen. |
| Drei weitere Entwürfe zeigen unter dem leeren Feld schon das fertige Bild in voller Farbe: „Im Bild“ (rundes Loch), „Kreuz“ (Kreuzschnitt), „Gerissen“ (gezacktes Loch). | Vorschläge vom 14.11.2026 auf den Wunsch nach deutlicheren Löchern und Farben, Kreuz und Splitter waren Ideen des Auftraggebers. Welcher Entwurf Voreinstellung wird, entscheidet er nach dem Ausprobieren. |
| Stand 14.11.2026 abends: Es bleiben drei Entwürfe, „Schälchen“ (Voreinstellung), „Kreuz“ und „Ring“. „Gestanzt“, „Im Bild“ und „Gerissen“ sind entfernt. Das Kreuz ist neu: eine Schale in aufgehellter Zielfarbe mit dem Abdruck eines Kreuzschlitz-Schraubendrehers in der Mitte. Unter keinem Entwurf liegt mehr das fertige Bild offen. | Entscheidung des Auftraggebers nach dem Ausprobieren. Das Kreuz soll wie eine Mulde mit Druckloch nach unten wirken. Wer einen entfernten Entwurf gewählt hatte, bekommt die Voreinstellung. |
| Das Tempo der rollenden Murmeln lässt sich in den Einstellungen mit einem Regler in sechs Stufen wählen, von knapp halb so schnell bis gut dreimal so schnell. Die Voreinstellung (13 Felder pro Sekunde) liegt in der Mitte. | Wunsch des Auftraggebers (14.11.2026). Das Tempo gilt ab dem nächsten Zug. |
| Murmeln gibt es mit und ohne Spiegelung. | Wunsch des Auftraggebers: Die Glasmurmeln zeigen durch ihre Spiegelungen viele Farbtöne. Ohne Spiegelung ist jede Murmel eine matte Kugel in genau einer Farbe. |
| Es gibt ein Einstellungen-Blatt: leere Felder, Murmeln, Detail, Holzbrett, Klang. Es öffnet sich von der Startseite und über ein Symbol in der Spielleiste. | Jede Wahl gilt sofort und bleibt gespeichert. Der Klang lässt sich im Spiel zusätzlich mit einem Tipp auf das Lautsprecher-Symbol umschalten. |
| Jedes Bild lässt sich in sechs Detailtiefen spielen, von 16 × 16 bis 50 × 50 Murmeln, oder so, wie es gemalt wurde. | Wunsch des Auftraggebers: dasselbe Bild einmal leichter, einmal aufwendiger und dafür genauer. Jede Größe hat ihren eigenen Spielstand. Alle Bilder sind in allen Größen als lösbar getestet. |
| Das Bild lässt sich mit zwei Fingern vergrößern und mit einem Finger verschieben. Das Holzbrett bleibt dabei stehen. | Wunsch des Auftraggebers: Bei vielen kleinen Murmeln muss man näher herankommen. Deshalb gilt ein Tipp jetzt beim Loslassen des Fingers, nicht mehr beim Aufsetzen: Nur so lässt sich Tippen von Ziehen unterscheiden. |

## Eigene Bilder (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Ein eigenes Foto bleibt in der Sammlung, mit Spielstand, auch nach dem Schließen. | Wunsch des Auftraggebers. Vorher war ein eigenes Bild weg, sobald man es verließ. |
| Aufbewahrt werden das zugeschnittene Foto (800 Bildpunkte Kantenlänge, JPEG), das Raster je Detailtiefe und der Spielstand. Alles bleibt auf dem Gerät. | Das Raster wird mitgespeichert, weil ein Spielstand nur zu genau dem Raster passt, mit dem er begonnen wurde. Neu gerechnet könnte es je nach Gerät leicht anders ausfallen. |
| Jedes Foto liegt unter einem eigenen Namen im Speicher des Browsers, getrennt vom übrigen Spielstand. | Passt ein Foto nicht mehr in den Speicher, bleibt es nur bis zum Schließen der Seite erhalten, und der Rest geht nicht verloren. |
| In den Einstellungen lässt sich wählen, wie stark sich die Murmelfarben eigener Fotos unterscheiden: Naturnah (wie bisher), Deutlich (mindestens ΔE 44), Kräftig (mindestens ΔE 56, danach so weit auseinander wie möglich). Die häufigste Farbe behält ihre naturnahe Murmel. | Wunsch des Auftraggebers: Bei Fotos aus Brauntönen und anderen dunklen Farben waren Schwarz, Braun, Dunkelrot und Dunkelblau als Glasmurmeln schwer auseinanderzuhalten. |
| Die Einstellung ändert nur die Murmelfarben, nicht die Felder. Zum Raster werden dafür die Farben des Fotos mitgespeichert; bei älteren Bildern werden sie aus dem Foto nachgelesen. | So bleibt ein angefangenes Bild beim Umstellen, wie es liegt, und das fertige Bild ist dasselbe Foto. |
| Ein eigenes Bild lässt sich aus der Sammlung entfernen. Der Knopf fragt beim ersten Tipp nach. | Sonst füllt sich der Speicher ohne Ausweg. |

## Oberfläche (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Auf dem Tablet hängt die Sammlung als Wand mit drei Spalten, im Querformat rechts neben dem Namen. | Vorher stand im Querformat die halbe Seite leer, und man sah nur zwei Bilder. Solange es sechs Blätter waren, hingen alle auf einmal an der Wand; seit es 16 sind, scrollt sie (siehe unten). |
| Als App auf dem Home-Bildschirm reicht der Himmel bis unter die Statusleiste (`black-translucent`). | Ein durchgehender Himmel statt eines Balkens. Der Stil wird beim Hinzufügen festgehalten: Wer ihn später ändert, muss die App löschen und neu hinzufügen. |
| Maße der Startseite hängen an der Spielfläche (`cqw`, `cqh`), nicht am Browserfenster (`vh`). | In Home-Bildschirm-Apps meldet iPadOS die Fensterhöhe teils falsch (WebKit-Fehler 316008). |

## Zehn weitere Motive und eine Sammlung, die scrollt (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Die Sammlung hat 15 Motive. Neu sind Segelboot im Abendlicht (16 × 16), Heißluftballon über Hügeln (18), Wüste am Abend (20), Kirschblütenzweig (22), Bergsee mit Boot (24), Lavendelfeld (26), Pilze im Moos (28), Leuchtturm im Zwielicht (28), Wal unter Sternen (30) und Koi im Teich (32). | Wunsch des Auftraggebers: zehn weitere. Sie unterscheiden sich in Tageszeit, Farbwelt und Gegenstand von den ersten fünf und voneinander. Die Größen liegen zwischen den bisherigen und darüber, damit die Sammlung von leicht nach aufwendig wächst. |
| Ein Motiv darf jede Kantenlänge haben, nicht nur die sechs Stufen der Detailtiefe. | Ein Motiv ist für eine Größe gemalt: so viele Murmeln, wie seine feinste Form braucht. Die Detailtiefe in den Einstellungen bleibt bei ihren Stufen, und jedes neue Motiv ist in allen sechs als lösbar getestet. |
| Auf dem Tablet scrollt die Wand senkrecht. Die Blätter bleiben so groß wie bei zwei Reihen. | 16 Blätter passen nicht auf eine Seite. Die frühere Regel, die Blätter ab dem siebten zusammenzurücken, hätte sie bei sechs Reihen unkenntlich klein gemacht. |
| Ein weicher Auslauf am unteren Rand der Wand zeigt, dass es weitergeht. Oben verschwinden die Blätter ebenso weich. | Die Wand hat keine Scrollleiste. Der Auslauf macht aus der angeschnittenen dritten Reihe ein Zeichen statt einer harten Kante. |
| Die Sammlung merkt sich, wie weit sie gescrollt war. | Wer aus einem Bild zurückkommt, steht wieder davor, statt oben neu zu suchen. Das gilt auch für das Regal auf schmalen Bildschirmen. |
| Der Name eines Motivs passt in eine Zeile unter dem Blatt. Das prüft ein Browsertest. | Ein zweizeiliger Name macht ein Blatt höher als seine Nachbarn. Unter dem Blatt ist Platz für knapp 13 Geviert; „Heißluftballon über Hügeln“ braucht 12,7. „Leuchtturm in der Dämmerung“ wäre mit 14,3 zu breit gewesen, deshalb heißt das Bild „Leuchtturm im Zwielicht“ (11,3), und aus „Wüste mit Kaktus am Abend“ wurde „Wüste am Abend“. |
| Neue Formenbausteine: Band entlang einer Kurve, Blatt, Kuppel, Sichel, Wolke, Ringstück, Ballonhülle, Säulenkaktus, runde Blüte. | Zweige, Fischleiber und Kakteen ließen sich bisher nur aus mehreren Stücken zusammensetzen, und jedes Stück würfe seinen Schatten auf das nächste. Ein Baustein ergibt einen einzigen Umriss, also ein einziges Stück Papier. |

## Technik

| Entscheidung | Warum |
| --- | --- |
| Web-App mit Canvas, TypeScript, Vite | Läuft sofort auf dem iPad, ohne App Store, und lässt sich als einzelne Datei einbetten. |
| Spielregeln als reine Funktionen in `src/core` | Vollständig testbar ohne Browser. Die Darstellung kann sich ändern, ohne dass Regeln brechen. |
| Motive als Daten (Palette und Formen) | Aus denselben Daten entstehen Murmelraster und Gemälde. Beides passt immer zusammen und ist prüfbar. |
| Klang im Browser erzeugt, keine Audiodateien | Keine Lizenzfragen, keine Ladezeit, und die Einzeldatei bleibt klein. Tonvorrat und Tonfolge sind reine Rechnung (`src/audio/tune.ts`) und damit testbar. |
| Ein Build für zwei Ziele | `dist/index.html` für GitHub Pages, `dist/artifact.html` zum Einbetten. |
| Schriften liegen bei und werden in die Seite eingebettet (14.11.2026) | Die öffentliche Seite lädt nichts von fremden Servern, auch keine Schriften von Google. Damit gehen beim Aufruf keine Besucherdaten an Dritte, und die Tests brauchen kein Netz. Preis: Die Seite wächst von 68 auf 294 kB. |
| Auslieferung auf GitHub Pages nur nach Schalter | Die Seite ist öffentlich. Das soll eine bewusste Entscheidung sein. Seit dem 14.11.2026 ist der Schalter an (Auftraggeber). |
| Das Repository ist öffentlich (14.11.2026) | GitHub Pages lässt im kostenlosen Tarif kein privates Repository zu. Die Abschrift des Erklärvideos liegt deshalb nicht im Repository, und die Commits tragen die GitHub-Adresse statt einer privaten Mailadresse. |

## App Store (14.11.2026)

| Entscheidung | Warum |
| --- | --- |
| Die iOS-App ist eine Hülle (Capacitor 8, Swift Package Manager) um den Web-Build, kein Neubau in Swift. | Ein Stand für Webseite und App. Ein Neubau würde rund einen Arbeitstag kosten und danach doppelte Pflege bedeuten. |
| Die App fragt nur nach der Kamera, und nur, wenn man für ein eigenes Bild „Foto aufnehmen“ wählt. | Die Fotoauswahl von iOS braucht keine Freigabe. Ohne den Kamera-Hinweis würde die App beim Aufnehmen beendet. |
| Die App läuft auf iPad und iPhone, hoch wie quer. | Die Webseite kann beides schon. Ob das iPhone im App Store angeboten wird, entscheiden die Entwickler vor dem Einreichen. |

