# Art Direction: Papier und Glas

Wie Murmel aussieht, sich bewegt und klingt, und warum. Die Begründungen stammen aus zwei Recherchen in
[`notizen/`](../notizen/): [meditatives Spieldesign](../notizen/recherche-meditatives-spieldesign.md) und
[Technik auf dem iPad](../notizen/recherche-technik-ipad-web.md). Kennungen wie K7 oder [3.4] verweisen auf die
Belege dort.

In jeder Tabelle steht, worauf eine Regel beruht:

- **Beleg**: Die Quelle sagt das so, als Aussage von Entwicklern oder als Studienergebnis.
- **Folgerung**: eigene Ableitung für dieses Spiel. Plausibel, aber nicht bewiesen.
- **Vorgabe**: Entscheidung des Auftraggebers.

Die Spielregeln selbst stehen in [entscheidungen.md](entscheidungen.md).

## Leitsatz

Ein Blatt Papier, darauf Glasmurmeln, daneben ein helles Holzbrett. Man ordnet, und aus dem Ordnen wird ein Bild,
das man aufhängen würde. Nichts zählt mit, nichts drängt, nichts kann schiefgehen.

Daraus folgen vier Prüffragen für jede Änderung:

1. Wird das Spiel dadurch sicherer, großzügiger oder weicher? Wenn nichts davon: weglassen. (K1, [1.2])
2. Fühlt sich das Rollen der Kette danach besser an oder nur voller? (K4, [1.28])
3. Würde das fertige Bild als Druck an der Wand bestehen? ([2.1], [2.2])
4. Stört es jemanden, der nebenbei ein Hörbuch hört? (So wird laut Erklärvideo des Auftraggebers gespielt.)

## Was bewusst fehlt

| Was fehlt | Worauf das beruht |
| --- | --- |
| Punkte, Züge, Zeit, Sterne, Münzen, Bestenliste, Bewertung | Vorgabe. Deckt sich mit dem Beleg, dass äußere Belohnungen und Pflichten das zerstören, was ein Spiel behaglich macht (K1, [1.3]), und mit Spielen, die genau das weglassen (K2). |
| Vorschläge für Züge | Vorgabe. Dazu passt: mehrere Lösungen statt einer besten ([1.22]). |
| Fehlerton, Sackgasse, erzwungener Neustart | Folgerung aus [1.2] und [1.31]: Was nicht geht, wird leise gesagt und sacht gezeigt. Jeder Zug lässt sich zurücknehmen, jedes Bild kann liegen bleiben. |
| Belohnungsdialog, automatischer Wechsel zum nächsten Bild | Folgerung aus [1.3]: Das fertige Bild bleibt stehen, bis man von selbst weitergeht. |
| Benachrichtigungen, Serienzähler, tägliche Pflicht | Beleg [1.3]: Sie nehmen die Hoheit über die eigene Aufmerksamkeit. |
| Haptik | Auf dem iPad aus dem Web nicht verfügbar (Technik-Recherche 4.1). Das Einrasten muss über Bild und Klang spürbar werden. |

Ein offener Punkt aus dem Erklärvideo: der Wunsch nach einem Zeichen für kluge Züge. Er ist ohne Zahl gelöst. Eine
lange Kette klingt als längere Tonfolge, und eine vollendete Farbe bekommt einen volleren Klang (siehe Klang).

## Bildsprache

| Regel | Worauf sie beruht | Wo umgesetzt |
| --- | --- | --- |
| Jedes Motiv ist ein Papierschnitt: wenige flache Lagen, weiche Schatten zwischen den Lagen, Licht von oben links. | Beleg: Bildsprache entsteht durch Beschränkung (K5), echte Materialien geben Wärme (K6, [2.11], [2.12]). Folgerung: Papier passt zum Raster, weil flache Farbflächen als Murmeln lesbar bleiben. | `src/art/scenes.ts`, `src/art/paint.ts` |
| Das Spielbrett ist ein Druck mit Papierrand und Bildunterschrift. Die Sammlung zeigt alle Drucke leicht schief wie an einer Wand. | Beleg [2.1]: Jeder Bildschirm soll als Bild an der Wand bestehen können. | `src/app/view.ts`, `src/styles.css` |
| Fortschritt ist Bildwerdung. Wo eine Murmel richtig liegt, geht sie im Gemälde auf. Es gibt keinen Balken und keine Prozentzahl. | Beleg [1.13], [2.5]: Was man tut, verändert die Welt sichtbar. | `BoardView` in `src/app/view.ts` |
| Fünf bis sieben Farben je Bild. | Beleg: etwa zehn Farben im ganzen Spiel bei A Little to the Left, höchstens fünf Farbkanäle je Objekt bei Dorfromantik (K5, [2.8], [2.10]). Die Zahl ist ein Richtwert aus zwei Spielen. | Paletten in `src/art/scenes.ts` |
| Höchstens eine kräftige Farbe je Bild (Buntheit über 60), im Mittel höchstens 40. Der Himmel hinter dem Bild bleibt unter 40. | Beleg K7: In zwei Studien steigt die Erregung mit der Sättigung ([2.20], [2.21]). Die Schwellen sind eigene Festlegung. | Test in `src/art/scenes.test.ts` |
| Je zwei Murmelfarben liegen mindestens ΔE 27 auseinander. | Folgerung: Kleine Glasmurmeln mit Glanz und Schatten brauchen mehr Abstand als Farbflächen. | Test in `src/art/scenes.test.ts` |
| Die Farben bleiben auch bei Rot-Grün-Sehschwäche unterscheidbar (nachgebildet nach Machado et al. 2009, ΔE mindestens 20). | Beleg [2.10]: Lesbarkeit entsteht über Helligkeit, Stimmung über Farbton. Folgerung: Etwa jeder zwölfte Mann sieht Rot und Grün schlecht, ein Sortierspiel nach Farben muss das aushalten. | `simulate` in `src/core/color.ts`, Test in `src/art/scenes.test.ts` |
| Ein leeres Feld sieht auf einen Blick anders aus als eine Murmel: matt statt glänzend, vertieft statt gewölbt. Sechs Entwürfe stehen in den Einstellungen zur Wahl. Drei tragen die Zielfarbe selbst (Gestanzt, Schälchen, Ring), drei zeigen darunter schon das fertige Bild und sind nur noch die Öffnung darin (Im Bild, Kreuz, Gerissen). | Vorgabe: Die ersten dunklen Mulden sahen dunklen Murmeln zu ähnlich, und die Farben waren zu wenig zu ahnen. Beleg [2.10]: Lesbarkeit entsteht über Helligkeit. Welcher Entwurf bleibt, entscheidet der Auftraggeber beim Spielen. | `src/art/holes.ts`, Musterblatt unter `dev/loecher.html` |
| Glasmurmeln mit Katzenauge, weichem Schatten und einem kleinen Glanzpunkt. Der Kern dreht sich mit dem gerollten Weg. Wahlweise ohne Spiegelung: eine matte Kugel in genau einer Farbe, nur sanft schattiert. | Vorgabe (Murmeln aus Glas; die Variante ohne Spiegelung, weil die Spiegelungen viele Farbtöne zeigen). Beleg [1.23]: Bewegung deutet Gewicht und Material an. | `src/art/marble.ts` |
| Helles Holzbrett als Ablage, Maserung der Länge nach. | Vorgabe. Deckt sich mit [2.12] (natürliche Materialien, warmes Licht). | `src/art/materials.ts` |
| Zwei Schriften: Fraunces kursiv für alles, was zum Bild gehört (Name, Bildunterschrift, leise Sätze), Figtree in Versalien für die wenige Bedienung. | Folgerung: Die Serifenschrift trägt den Charakter eines Drucks, die Bedienung tritt zurück. Fraunces läuft mit weichen Enden (Achse SOFT auf 100). | `src/styles.css`, `src/app/theme.ts` |

Das Papierkorn, die Holzmaserung und die Murmeln sind gerechnet, nicht fotografiert. Fotografiertes Material wie bei
KAMI 2 ([2.11]) wäre der nächste Schritt zu mehr Wärme; es bräuchte eigene Aufnahmen und würde die Einzeldatei
vergrößern.

Bei Rot-Grün-Sehschwäche gemessen (kleinster Abstand je Bild, Stand 14.11.2026): Mond 26,6, Nebelberge 28,6,
Seerosen 21,1, Birken 21,5, Fuchs 25,5. Vor der Korrektur lagen Seerosen bei 9,7 und Birken bei 9,1. Die zehn
Motive, die am 14.11.2026 dazukamen, sind von Anfang an auf diese Schwelle hin gebaut: Segelboot 21,8, Ballon 21,6,
Wüste 24,7, Kirschblüte 21,5, Bergsee 22,8, Lavendel 21,6, Pilze 21,6, Leuchtturm 25,4, Wal 21,9, Koi 21,5. Die
seltene Blau-Gelb-Schwäche ist nicht abgesichert (Segelboot 11,0 zwischen Sonne und Segel, Seerosen 14,3,
Kirschblüte 14,7), ebenso wenig die 17 Farben für eigene Fotos.

### Die 15 Motive

Jedes Motiv hat seine eigene Tageszeit, Farbwelt und seinen eigenen Gegenstand, damit die Wand der Sammlung nicht
eintönig wird (Vorgabe für die zehn Motive vom 14.11.2026). Die Größe wächst mit der Feinheit der Formen: Große
Flächen wie Segel und Hügel tragen schon mit 16 Murmeln je Kante, ein gebogener Fischleib braucht 32.

| Motiv | Murmeln je Kante | Tageszeit und Farbwelt |
| --- | --- | --- |
| Mond über dem See | 16 | Nacht: Indigo, Flieder, Türkis |
| Segelboot im Abendlicht | 16 | goldener Abend: Apricot über Petrol, weiße Segel |
| Heißluftballon über Hügeln | 18 | heller Morgen: Himmelblau, Frühlingsgrün, ein roter Ballon |
| Nebelberge | 20 | tiefe Sonne im Dunst: Pfirsich, Rosa, Flieder, Blau |
| Wüste am Abend | 20 | Abenddämmerung: Malve, Violett, Terrakotta, Kaktusgrün |
| Kirschblütenzweig | 22 | Frühling wie auf einem Holzschnitt: Papierweiß, rote Sonne, Rosa |
| Seerosen | 24 | Teich von oben: Petrol, Grün, zartes Rosa |
| Birken im Herbst | 24 | Herbsttag: Gelb, Orange, Rost, weiße Stämme |
| Bergsee mit Boot | 24 | klarer Morgen: blassgelber Himmel, Schieferblau, Türkis, ein rotes Boot |
| Lavendelfeld | 26 | Sommerabend: Violett in zwei Tönen, Salbeigrün, Buttergelb |
| Fuchs im Schnee | 28 | Winternacht: Nachtblau, Schneeweiß, Fuchsorange |
| Pilze im Moos | 28 | Waldboden: dunkles Tannengrün, Moos, Fliegenpilzrot |
| Leuchtturm im Zwielicht | 28 | blaue Stunde: Taubenblau, dunkle See, Rot und Weiß, gelbes Licht |
| Wal unter Sternen | 30 | Nacht über und unter Wasser: Aubergine, Seegrün, ein fast schwarzer Wal |
| Koi im Teich | 32 | dunkles Wasser von oben: Zinnober, Gold, Weiß, Seerosengrün |

Sieben Motive haben eine kräftige Farbe als Akzent (das Rot von Ballon, Sonne, Boot, Pilzhut, Leuchtturm und Koi,
das Orange der Fische unter dem Wal), drei kommen ganz ohne aus (Segelboot, Wüste, Lavendel). Farben, die bei
Rot-Grün-Sehschwäche zusammenfallen würden, sind über die Helligkeit getrennt, etwa das Rot des Ballons vom Grün
der Hügel und das Rosa der Blüten vom Rot der Sonne dahinter.

## Bewegung

| Regel | Worauf sie beruht | Wo umgesetzt |
| --- | --- | --- |
| Das Rollen der Kette ist die eine Bewegung, die stimmen muss. Die Murmeln folgen einander in festem Abstand durch einen gemeinsamen Einstieg. | Vorgabe (Kette statt Wolke). Beleg K4, [1.28]: Die häufigste Handlung muss sich am besten anfühlen. | `src/core/chain.ts` |
| Ruhiges Tempo: 13 Felder in der Sekunde (zuerst 9; dem Auftraggeber war das am 14.11.2026 etwas zu langsam). Auf dem letzten Stück rollt jede Murmel aus und kommt mit zwei Fünfteln ihres Tempos an. | Beleg [1.2] (langsameres Tempo), [1.23] (Gewicht). Die Zahlen sind eigene Festlegung. | `SPEED`, `EASE_CELLS` in `src/app/view.ts`, `ARRIVE` in `src/core/chain.ts` |
| Niemand wartet auf eine Bewegung. Man kann weitertippen, während die Kette noch rollt. | Folgerung aus K3: Kontrolle statt Druck, das Tempo bestimmt die Spielerin. | `PlayScreen.tap` |
| Gewählte Murmeln schweben leicht und sinken zurück, bevor sie rollen. Passende Löcher leuchten in einem langsamen Puls von vier Sekunden. | Beleg [1.23]: Jede Berührung bekommt sofort Rückmeldung. | `BoardView.draw` |
| Kein Glitzern. Höchstens zwei Lichter wandern gleichzeitig langsam über Murmeln. | Beleg [1.28]: Keine Animation darf die Ruhe stören. K1: Grelle Reize zerstören Behaglichkeit. | `spawnTwinkle` |
| Geht etwas nicht, wiegt sich das Holzbrett einmal sacht. Kein Schütteln. | Folgerung aus [1.31]: sehr weiche Fehlzustände. | `BoardView.shake` |
| Bewegung rechnet mit der Uhr, nicht mit Bildern. | Beleg (Technik 3.4): Safari zeichnet je nach Lage mit 30, 60 oder 120 Bildern in der Sekunde. | `BoardView.frame` |
| Wer im System weniger Bewegung eingestellt hat, bekommt keine Rollbewegung, kein Atmen des Lichts und keine Lichter. | Folgerung: Die Einstellung ist ein ausdrücklicher Wunsch. | `prefers-reduced-motion` in `src/styles.css`, `reduceMotion` in `src/app/view.ts` |

## Klang

Alles wird im Browser erzeugt, es gibt keine Audiodateien.

| Regel | Worauf sie beruht | Wo umgesetzt |
| --- | --- | --- |
| Klang entsteht aus dem, was man tut: Jede einrastende Murmel schlägt einen Ton an. | Beleg K8, [3.4], [3.9]: Spielereignisse als Noten einer größeren Komposition. | `Sound.clink` |
| Alle Töne eines Bildes stammen aus einem Tonvorrat, einer Fünftonleiter über dem Grundton des Bildes. Jedes Bild hat seinen eigenen Grundton. | Beleg [3.8], [3.9], [3.11]: Klänge werden auf die Tonart der Szene gestimmt. Die Fünftonleiter ist der einfachste Weg dorthin, als Wahl aber schwach belegt (K9, [3.16]). | `src/audio/tune.ts`, `mood.root` je Motiv |
| Gleichzeitige Töne werden aufgefächert: mindestens 90 ms Abstand, höchstens eine halbe Sekunde Verzug, der Rest entfällt. | Beleg [3.4], [3.6]: Mini Metro begrenzt Ereignisse und fächert sie rhythmisch auf. Gemessen: Rollt eine Kette in einen Gang, kommen sechs Murmeln innerhalb von 32 ms zur Ruhe. | `Spread` in `src/audio/tune.ts` |
| Eine Kette endet auf Grundton oder Quinte. Wird eine Farbe vollständig, klingen Grundton und Quinte leise darunter auf. | Beleg [3.13]: Musikalischere Klänge markieren Erfolge und Übergänge. Folgerung: So bekommt ein guter Zug ein Zeichen ohne Zahl. | `restStep`, `Sound.settle` |
| Weiche, sinusartige Töne. Nichts Raues, auch nicht als Hinweis. | Beleg [3.5] (Sinusklänge bei Mini Metro), [3.21] (raue Klänge wirken als Alarm). | `Sound.bell`, `Sound.nope` |
| Der Raum: einzelne lange Töne im Takt eines Atemzugs. Welche Töne klingen, wechselt, und etwa jeder fünfte Atemzug bleibt still. | Beleg [3.1], [3.2]: Regeln statt Schleife, Musik so überhörbar wie interessant. [3.20]: Entspannung zeigte sich am deutlichsten in der Stille. | `Sound.breath` |
| Drei Stufen: alles, nur Murmeln, still. | Folgerung aus der Nutzung neben Hörbüchern. | `SoundMode`, wählbar in den Einstellungen und über das Symbol in der Spielleiste |
| Der Klang mischt sich unter andere Apps und unterbricht sie nicht. Dafür schweigt er im Stummmodus des iPad. | Beleg (Technik 1.3, 1.4): Die Tonkategorie „ambient“ mischt und folgt dem Stummschalter. Eine Kategorie, die mischt und den Stummmodus übergeht, gibt es im Web nicht. | `Sound.build` |

Abweichung von der Recherche: Empfohlen sind zwei Schichten, echte Aufnahmen für das Greifbare und gestimmte Töne für
das Musikalische ([3.12], [3.13]). Murmel hat bisher nur die zweite. Das Klopfen auf dem Holzbrett ist gerechnet.
Aufnahmen von echtem Glas auf Holz wären die naheliegende Verbesserung.

## Atem

Das Licht des Himmels und der Raumklang schwellen gemeinsam an und ab: vier Sekunden heller und lauter, sechs
Sekunden dunkler und leiser, also sechs Atemzüge in der Minute.

- **Beleg**: Langsames Atmen um sechs Züge pro Minute erhöht die Herzratenvariabilität zuverlässig; das passende
  Tempo liegt je nach Person zwischen 4,5 und 6,5 (K10, [4.1], [4.2]). Die Wirkung auf Stress und Angst ist in
  Metaanalysen klein bis mittel und setzt voraus, dass jemand tatsächlich mitatmet.
- **Erste Hinweise**: Ein Takt am Rand des Bildschirms oder ein regelmäßiges An- und Abschwellen in Ambient-Musik
  verlangsamte die Atmung auch ohne Aufforderung ([4.16], [4.17]). Das sind kleine Arbeiten.
- **Nicht belegt**: dass ein Atemtakt in einem Puzzlespiel entspannt. Dazu gibt es keine Studie.

Deshalb ist der Atem ein stilles Angebot. Das Spiel fordert nirgends zum Atmen auf und verspricht keine Wirkung auf
die Gesundheit ([4.13]). Ob Ein- und Ausatmen gleich lang sein sollten, ist offen ([4.12]); vier zu sechs ist eine
Wahl nach Gefühl. Das Tempo ist nicht einstellbar.

Überhaupt gilt: Ein Spiel beruhigt nicht von selbst. In einem Laborversuch hat ein Puzzlespiel aktiviert statt
beruhigt (K11, [4.22]). Dass Sortierspiele beruhigen, ist nicht belegt (K12). Die Ruhe in Murmel ist gestaltet, über
Tempo, Klang, Farbe und fehlenden Druck. Ob sie ankommt, zeigt nur das Spielen.

## Ablauf und Oberfläche

| Regel | Worauf sie beruht | Wo umgesetzt |
| --- | --- | --- |
| Die Bedienung liegt am Rand: ein Wort links, zwei Symbole rechts. Im Bild steht kein Text. | Beleg [1.32]: Ruhige Technik nutzt den Rand der Aufmerksamkeit. [2.15]: Einrasten ersetzt Raster und Zähler. | `.bar` in `src/styles.css` |
| Die Einstellungen liegen hinter einem unauffälligen Symbol: ein Blatt Papier mit wenigen Fragen (leere Felder, Murmeln, Detail, Holzbrett, Klang). Jede Wahl gilt sofort, es gibt kein Speichern und kein Abbrechen. | Vorgabe (wählbare Entwürfe und Größen). Beleg [1.32]: Was selten gebraucht wird, gehört an den Rand. | `src/app/settings.ts` |
| Hinweise in Worten erscheinen nur die ersten beiden Male und wenn etwas nicht geht. Sie kommen als ein kursiver Satz und verschwinden wieder. | Folgerung: Ohne jede Führung macht fehlender Druck ratlos. Vorschläge für Züge sind ausgeschlossen (Vorgabe), also bleiben Worte. | `PlayScreen.hint` |
| Die Schwierigkeit wählt man mit dem Bild (von 16 × 16 bis 32 × 32) oder mit der Detailtiefe in den Einstellungen (bis 50 × 50). Viele kleine Murmeln holt man sich mit zwei Fingern näher heran; das Holzbrett bleibt stehen. | Beleg [1.8]: Die Wahl gehört ins Spiel, nicht in ein Menü vor jedem Bild. Vorgabe (Detailtiefe, Zoom). | `SCENES` in `src/art/scenes.ts`, `src/core/camera.ts`, `src/app/gestures.ts` |
| Ein Bild dauert einige Minuten und kann jederzeit liegen bleiben. Der Stand wird nach jedem Zug gespeichert. | Beleg [1.24] (kurze, klar umrissene Einheiten). Die untersuchten Dosen sind klein (5 bis 15 Minuten). | `src/app/storage.ts` |
| Nach dem letzten Zug gehört der Bildschirm dem Bild. Das Holzbrett blendet aus, erst nach einem Moment stehen zwei leise Wege daneben. | Folgerung aus [1.3] und [2.1]. | `PlayScreen.finished` |
| Auf dem Tablet hängen die Bilder an einer Wand, drei nebeneinander. Mit 15 Motiven ist sie höher als der Bildschirm und scrollt senkrecht: Zwei Reihen sind ganz zu sehen, die dritte schaut hervor, und ein weicher Auslauf am unteren Rand zeigt, dass es weitergeht. Fertige Bilder sind farbig, begonnene teilweise, neue blass. Eigene Fotos hängen am Ende wie jeder andere Druck. | Folgerung: Die Sammlung zeigt, was entstanden ist, ohne es zu zählen. Die Blätter bleiben so groß wie bei zwei Reihen, weil ein kleineres Blatt als Bild kaum noch zu erkennen wäre. Folgerung aus [1.32]: Der Auslauf sagt am Rand, dass es weitergeht, ohne Pfeil, Zähler oder Scrollleiste. Vorgabe (eigene Bilder bleiben, zehn weitere Motive). | `renderShelf` in `src/app/home.ts`, `--shelf-mask` und `@container` in `src/styles.css`, `src/app/library.ts` |
| Wer aus einem Bild zurückkommt, steht in der Sammlung wieder an derselben Stelle. | Folgerung: Bei 16 Blättern müsste man das eben gespielte Bild sonst jedes Mal neu suchen. | `showHome` in `src/app/app.ts` |

## Auf dem iPad

Die Einzelheiten und Quellen stehen in der [Technik-Recherche](../notizen/recherche-technik-ipad-web.md). Was davon
das Erleben betrifft:

- Ton beginnt erst nach dem ersten Loslassen eines Fingers und wird bei jeder Berührung und bei der Rückkehr in die
  App neu geweckt, weil iPadOS ihn beim Verlassen anhält (Technik 1.1, 1.2).
- Als App auf dem Home-Bildschirm reicht der Himmel bis unter die Statusleiste. Bedienung und Bild halten Abstand zu
  Statusleiste und Wischbalken.
- Der Bildschirm wird nicht künstlich wach gehalten. Wer innehält, darf das iPad einschlafen lassen; der Stand ist
  gespeichert.
- Die Ausrichtung lässt sich im Web nicht sperren. Das Spiel ist für Hoch- und Querformat gebaut.

## Nicht geprüft

- Der Klang ist nach Regeln gebaut und auf Fehlerfreiheit gemessen, aber nicht mit Ohren beurteilt. Lautstärken,
  Tonlagen und Ausklang brauchen eine Hörprobe auf dem iPad.
- Nichts davon lief auf einem echten iPad. Geprüft ist WebKit im iPad-Format über Playwright.
- Die Sammlung scrollt in den Tests per Skript. Wie sich das Wischen mit dem Finger anfühlt und ob der weiche Auslauf
  (eine CSS-Maske über der scrollenden Wand) auf dem iPad flüssig bleibt, ist offen.
- Die zehn Motive vom 14.11.2026 sind als Bilder und als Raster angesehen, aber noch von niemandem gespielt.
- Wie sich Statusleiste und Fenstermodus von iPadOS 26 und 27 auf die Ränder auswirken, ist laut Recherche nicht
  dokumentiert und teils fehlerhaft (WebKit-Fehler 301994).
- Ob das Spiel beruhigt, hat niemand gemessen.
