/**
 * Alle Texte des Spiels auf Deutsch. Deutsch ist die Ausgangssprache: Ein neuer Text entsteht hier, und jede
 * andere Sprache muss ihn ebenfalls haben, sonst scheitert die Typprüfung.
 * In geschweiften Klammern stehen Platzhalter, `\n` ist ein Zeilenumbruch.
 */
export const de = {
  // ---------- Startseite ----------
  vacuum: 'Sauger',
  meta_description: 'Glasmurmeln rollen an ihren Platz, und ein Bild entsteht. Ohne Punkte, ohne Eile.',
  lede: 'Murmeln rollen an ihren Platz, und ein Bild entsteht.\nOhne Punkte, ohne Eile.',
  shelf_label: 'Sammlung der Bilder',
  settings: 'Einstellungen',
  install: 'App installieren',
  legal_imprint: 'Impressum',
  legal_privacy: 'Datenschutz',
  state_started: 'begonnen',
  state_finished: 'fertig',
  own_first: 'Eigenes Bild',
  own_more: 'Noch ein Bild',
  own_choose: 'Foto wählen',
  own_name: 'Eigenes Bild',
  own_name_n: 'Eigenes Bild {n}',
  remove_label: '{name} entfernen',
  remove_ask: 'entfernen?',

  // ---------- Spiel ----------
  board_label:
    'Spielbrett. Tippe eine Murmel an, um sie und angrenzende Murmeln gleicher Farbe zu wählen. Tippe dann ein freies Loch dieser Farbe oder die Ablage an.',
  bar_label: 'Spiel',
  back: 'Sammlung',
  fit: 'Ganzes Bild zeigen',
  undo: 'Zug zurücknehmen',
  finish_line: 'Das Bild ist fertig.',
  again: 'noch einmal',
  onward: 'zur Sammlung',
  hint_zoom: 'Mit zwei Fingern lässt sich das Bild vergrößern.',
  hint_start: 'Tippe auf eine Murmel.',
  hint_hole: 'Tippe auf ein leuchtendes Loch.',
  hint_tray: 'Für diese Farbe ist noch kein Loch frei. Tippe auf eine freie Mulde im Holzbrett.',
  hint_rest: 'Der Rest bleibt gewählt.',
  hint_pick_tray: 'Tippe auf das Holzbrett, um seine Murmeln zu wählen.',
  say_tray_full: 'Das Holzbrett ist voll. Lege erst Murmeln von dort ins Bild.',
  say_wrong_color: 'In dieses Loch gehört eine andere Farbe.',
  say_pick_first: 'Tippe zuerst auf eine Murmel.',

  // ---------- Klang ----------
  sound_label_alles: 'Klang an',
  sound_label_murmeln: 'Nur Murmeln',
  sound_label_aus: 'Klang aus',
  sound_toggle: '{label}. Tippen schaltet um.',
  sound_said_alles: 'Klang an: Murmeln und Raum.',
  sound_said_murmeln: 'Nur die Murmeln klingen.',
  sound_said_aus: 'Still.',
  sound_muted: 'Klang an. Bleibt es still, ist das iPad stummgeschaltet.',

  // ---------- Einstellungen ----------
  set_holes: 'Leere Felder',
  hole_schale: 'Schälchen',
  hole_kreuz: 'Kreuz',
  hole_ring: 'Ring',
  set_marbles: 'Murmeln',
  marble_glas: 'Mit Spiegelung',
  marble_matt: 'Ohne Spiegelung',
  set_tempo: 'Tempo der Murmeln',
  tempo_slow: 'Ruhig',
  tempo_fast: 'Schnell',
  tempo_1: 'sehr ruhig',
  tempo_2: 'ruhig',
  tempo_3: 'normal',
  tempo_4: 'zügig',
  tempo_5: 'schnell',
  tempo_6: 'sehr schnell',
  set_detail: 'Detail: Murmeln je Kante',
  detail_painted: 'Wie gemalt',
  detail_note: 'Mehr Murmeln geben das Bild genauer wieder und dauern länger. Jede Größe hat ihren eigenen Spielstand.',
  set_tray: 'Holzbrett: Mulden',
  tray_note: 'Auf dem Brett liegen gerade mehr Murmeln. Die neue Größe gilt ab dem nächsten Bild.',
  set_contrast: 'Eigene Fotos: Farben',
  contrast_naturnah: 'Naturnah',
  contrast_deutlich: 'Deutlich',
  contrast_kraeftig: 'Kräftig',
  contrast_note:
    'Liegen die Farben eines Fotos nah beieinander, hebt „Deutlich“ oder „Kräftig“ die Murmeln stärker voneinander ab. Das fertige Bild bleibt, wie es ist.',
  set_sound: 'Klang',
  sound_alles: 'Alles',
  sound_murmeln: 'Nur Murmeln',
  sound_aus: 'Still',
  sound_note: 'Der Klang folgt dem Stummmodus des Geräts. So läuft ein Hörbuch ungestört weiter.',
  set_language: 'Sprache',
  language_auto: 'Automatisch',
  settings_close: 'Einstellungen schließen',
  build_preview: 'Testversion {version} · Stand {date} Uhr',
  build_release: 'Version {version} · Stand {date} Uhr',
  done: 'Fertig',

  // ---------- Installation ----------
  install_title: 'Als App installieren',
  install_note: 'Die App hat ihren eigenen Speicher. Was du hier im Browser gespielt hast, bleibt im Browser.',
  install_ios:
    'Tippe auf das Teilen-Symbol (auf dem iPhone steckt es unter „…“) und dann auf „Zum Home-Bildschirm“. Murmel startet danach wie eine App, ohne Adressleiste, und läuft auch ohne Netz.',
  install_mac:
    'Wähle in Safari oben im Menü „Ablage“ und dann „Zum Dock hinzufügen“. Murmel startet danach wie eine App und läuft auch ohne Netz.',

  // ---------- Motive: Schlüssel ist `scene_` und die Kennung des Motivs ----------
  scene_mond: 'Mond über dem See',
  scene_segelboot: 'Segelboot im Abendlicht',
  scene_ballon: 'Heißluftballon über Hügeln',
  scene_nebel: 'Nebelberge',
  scene_wueste: 'Wüste am Abend',
  scene_kirschbluete: 'Kirschblütenzweig',
  scene_seerosen: 'Seerosen',
  scene_birken: 'Birken im Herbst',
  scene_bergsee: 'Bergsee mit Boot',
  scene_lavendel: 'Lavendelfeld',
  scene_fuchs: 'Fuchs im Schnee',
  scene_pilze: 'Pilze im Moos',
  scene_leuchtturm: 'Leuchtturm im Zwielicht',
  scene_wal: 'Wal unter Sternen',
  scene_koi: 'Koi im Teich',
};

export type TextKey = keyof typeof de;
/** Ein vollständiges Wörterbuch: jeder Schlüssel der Ausgangssprache, keiner mehr */
export type Texts = Record<TextKey, string>;
