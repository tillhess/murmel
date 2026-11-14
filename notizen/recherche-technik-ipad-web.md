# Recherche: Technikfakten für „Murmel" als iPad-Web-App (Safari / iPadOS)

Stand der Recherche: **14.11.2026**

Aktuelle Versionen zum Stichtag:

- Safari 27.2 mit iPadOS 27.2 ist die aktuelle Freigabe (26.10.2026). Quelle: [WebKit-Blog „WebKit Features for Safari 27.2"](https://webkit.org/blog/18515/webkit-features-for-safari-27-2/)
- Safari 27.3 ist Beta (03.11.2026). Quelle: [Apple Safari Release Notes, Übersicht](https://developer.apple.com/documentation/safari-release-notes)
- Safari 27.0 kam im September 2026 mit iPadOS 27. Quelle: [WebKit-Blog „WebKit Features for Safari 27.0"](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)
- Vite-Doku: Version 8.3.7. Quelle: [Vite, Deploying a Static Site](https://vite.dev/guide/static-deploy#github-pages)

So ist die Datei zu lesen:

- **Belegt** heißt: Die Aussage steht so in der verlinkten Primärquelle. Die Versionsangabe steht direkt dabei.
- **Schlussfolgerung / Empfehlung** heißt: Das ist meine Ableitung aus den belegten Punkten, nicht die Aussage einer Quelle.
- **Unklar** heißt: Dazu gibt es keine Primärquelle oder die Quellen widersprechen sich.
- Verweise auf WebKit-Quelltext meinen den Zweig `main` am 14.11.2026. Das muss nicht in jedem Detail der ausgelieferten Version 27.2 entsprechen. Nur die Canvas-Grenze habe ich an Versions-Tags geprüft.
- Nichts davon ist auf einem Gerät getestet. Alles stammt aus Dokumenten, Quelltext und Fehlerberichten.
- Texte aus Quellen sind sinngemäß auf Deutsch wiedergegeben, nicht wörtlich zitiert.

---

## Kurzfassung

### Das tun

1. Den `AudioContext` erst in einem `pointerup`-, `touchend`- oder `click`-Handler erzeugen oder mit `resume()` starten, denn nur diese Ereignisse gelten bei Fingereingabe als Nutzeraktivierung. Quelle: [HTML-Spezifikation, User Activation](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation), [WebKit-Quelltext AudioContext.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)
2. Vor dem ersten Ton `navigator.audioSession.type = 'ambient'` setzen (ab Safari 16.4), damit der Spielklang sich mit dem Hörbuch mischt, statt es zu unterbrechen. Quelle: [Apple, AVAudioSession.Category.ambient](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient), [WebKit-Quelltext DOMAudioSession.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp)
3. Bei jeder Geste und bei `visibilitychange` den Zustand des Kontexts prüfen und `resume()` erneut aufrufen, weil iOS den Kontext beim Verlassen der Seite auf `interrupted` setzt. Quelle: [MDN, BaseAudioContext.state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)
4. Ein Manifest mit `display: "standalone"` und zusätzlich ein `apple-touch-icon` ausliefern, weil das Apple-Icon Vorrang vor Manifest-Icons hat. Quelle: [WebKit-Blog, Web Push for Web Apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
5. `viewport-fit=cover` setzen und wichtige Inhalte mit `env(safe-area-inset-*)` von den Rändern fernhalten (ab iOS 11.2). Quelle: [WebKit-Blog, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
6. Auf dem Canvas `touch-action: none` setzen, damit der Browser bei Fingerbewegungen weder verschiebt noch zoomt und die Zeigerereignisse nicht abbricht (ab Safari 13). Quelle: [W3C Pointer Events 3](https://www.w3.org/TR/pointerevents3/)
7. `-webkit-user-select: none` und `user-select: none` zusammen schreiben, weil die Schreibweise ohne Präfix erst in Safari 27.3 Beta kommt. Quelle: [Safari 27.3 Beta Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-27_3-release-notes)
8. Bewegung zeitbasiert rechnen, weil `requestAnimationFrame` je nach Lage mit 60, 30 oder 120 Bildern pro Sekunde läuft. Quelle: [WebKit-Quelltext AnimationFrameRate.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp)
9. Die Bildschirmsperre mit `navigator.wakeLock.request('screen')` verhindern und nach jeder Rückkehr in den Vordergrund neu anfordern (in Home-Bildschirm-Apps ab iPadOS 18.4). Quelle: [Safari 18.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes), [MDN, Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
10. Den Spielstand in der Home-Bildschirm-App ruhig lokal speichern, weil deren eigene Domain von der 7-Tage-Löschung ausgenommen ist. Quelle: [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)
11. Für GitHub Pages den Beispiel-Workflow aus der Vite-Doku nehmen und `base` auf `'/<REPO>/'` setzen. Quelle: [Vite, Deploying a Static Site](https://vite.dev/guide/static-deploy#github-pages)

### Das lassen

1. Nicht mit `await ctx.resume()` auf den Klang warten, bevor das Spiel startet, weil das Promise ohne gültige Geste offen bleibt. Quelle: [WebKit-Quelltext AudioContext.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp), [Web Audio API 1.1](https://webaudio.github.io/web-audio-api/)
2. Kein stilles `<audio>`-Element und kein `type = 'playback'` einsetzen, um den Stummmodus zu umgehen, weil beides die Wiedergabe-Kategorie wählt und das Hörbuch unterbricht. Quelle: [Apple, AVAudioSession.Category.playback](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playback), [WebKit-Quelltext MediaSessionManagerCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm)
3. Nicht auf `navigator.audioSession.state` oder dessen `statechange` bauen, weil beides in WebKit hinter einem abgeschalteten Schalter liegt. Quelle: [WebKit-Quelltext DOMAudioSession.idl](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.idl)
4. Nicht auf `user-scalable=no` im Viewport-Meta-Tag vertrauen, weil Safari das seit iOS 10 ignoriert. Quelle: [Apple, What's New in Safari 10](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_10_0.html)
5. Nicht auf das Manifest-Feld `orientation`, auf `screen.orientation.lock()` oder auf `display: "fullscreen"` bauen, weil Safari auf iPadOS nichts davon unterstützt. Quelle: [MDN-Kompatibilitätsdaten, Manifest](https://github.com/mdn/browser-compat-data/tree/main/manifests/webapp)
6. Nicht mit echtem Vollbild unter der Statusleiste rechnen, weil dazu seit iPadOS 26.1 ein wieder geöffneter Fehler besteht. Quelle: [WebKit-Bug 301994](https://bugs.webkit.org/show_bug.cgi?id=301994)
7. Die Fullscreen API nicht für das Spiel nutzen, weil sie auf dem iPad eine nicht abschaltbare Schaltfläche einblendet und Wischen nach unten das Vollbild beendet. Quelle: [MDN-Kompatibilitätsdaten, Element.requestFullscreen](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json)
8. Keine Haptik einplanen, weil Safari die Vibration API nicht anbietet und WebKit sie ablehnt. Quelle: [WebKit standards-positions #267](https://github.com/WebKit/standards-positions/issues/267)
9. Nicht mit 120 Hz rechnen, weil WebKit die Bildrate von Webseiten in der Voreinstellung nahe 60 Hz hält. Quelle: [WebKit-Quelltext UnifiedWebPreferences.yaml](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml)
10. Nicht auf `overscroll-behavior` gegen das Herunterziehen zum Neuladen vertrauen, weil das in iOS-Safari laut offenem Fehlerbericht nicht wirkt. Quelle: [WebKit-Bug 275947](https://bugs.webkit.org/show_bug.cgi?id=275947)
11. In der eingebetteten Sandbox-Variante nicht ungeschützt auf `localStorage` zugreifen, weil der Zugriff bei undurchsichtiger Herkunft einen `SecurityError` wirft. Quelle: [HTML-Spezifikation, Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)
12. Nichts Vertrauliches über GitHub Pages aus einem privaten Repository ausliefern, weil die Seite trotzdem öffentlich im Internet steht. Quelle: [GitHub Docs, Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

---

## 1. Web Audio auf iPadOS-Safari

### 1.1 Starten des AudioContext

**Belegt**

- Ein Kontext darf laut Spezifikation erst laufen, wenn der Browser den Wechsel von `suspended` nach `running` erlaubt. Der Browser darf das an eine frühere Nutzerinteraktion knüpfen. Quelle: [Web Audio API 1.1, Editor's Draft vom 06.11.2026](https://webaudio.github.io/web-audio-api/#AudioContext). Gilt browserunabhängig.
- WebKit ist strenger: Beim Start prüft es, ob das Fenster gerade eine kurzlebige („transiente") Nutzeraktivierung hat. Quelle: [WebKit-Quelltext AudioContext.cpp, Funktion `shouldDocumentAllowWebAudioToAutoPlay`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp). Stand: `main`, 14.11.2026.
- Safari 16.4 nennt eine Korrektur rund um die transiente Nutzeraktivierung für Web Audio. Die Formulierung dort ist mehrdeutig. Quelle: [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)
- Neue Kontexte bleiben in Safari angehalten, bis `resume()` aus einer Nutzeraktion heraus aufgerufen wird. Quelle: [MDN-Kompatibilitätsdaten AudioContext](https://github.com/mdn/browser-compat-data/blob/main/api/AudioContext.json). Gilt ab Safari 14.1 (seitdem ohne `webkit`-Präfix).
- MDN empfiehlt, den Kontext in einer Nutzergeste zu erzeugen oder fortzusetzen. Quelle: [MDN, Web Audio API best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
- Als aktivierende Ereignisse gelten: `keydown` (außer Esc), `mousedown`, `pointerdown` nur bei Maus, `pointerup` bei allem außer Maus, und `touchend`. Quelle: [HTML-Spezifikation, activation triggering input event](https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation). Gilt browserunabhängig.
- Ist der Start nicht erlaubt, löst WebKit das Promise von `resume()` erst auf, wenn der Kontext irgendwann läuft. Die Spezifikation sieht dasselbe vor. Quelle: [WebKit-Quelltext AudioContext.cpp, Funktion `resumeRendering`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp), [Web Audio API 1.1, `resume()`](https://webaudio.github.io/web-audio-api/#dom-audiocontext-resume)
- Nach dem ersten erlaubten Start entfernt WebKit die Gesten-Beschränkung für diesen Kontext. Quelle: [WebKit-Quelltext AudioContext.cpp, Funktion `willBeginPlayback`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)

**Schlussfolgerung / Empfehlung**

- Bei Fingereingabe zählen `pointerup`, `touchend` und `click`. `pointerdown` und `touchstart` zählen nicht. Ein Ton beim ersten Aufsetzen des Fingers kann also stumm bleiben.
- Am sichersten ist ein sichtbarer Startknopf („Tippen zum Beginnen"), dessen `click` den Kontext erzeugt.
- Spätere `resume()`-Aufrufe brauchen für denselben Kontext keine neue Geste mehr. Ein neu erzeugter Kontext braucht wieder eine.

### 1.2 Zustände und Unterbrechungen

**Belegt**

- Es gibt vier Zustände: `suspended`, `running`, `closed` und `interrupted`. Quelle: [Web Audio API 1.1, AudioContextState](https://webaudio.github.io/web-audio-api/#enumdef-audiocontextstate)
- `interrupted` kennt Safari laut MDN-Daten seit Version 9. Quelle: [MDN-Kompatibilitätsdaten BaseAudioContext](https://github.com/mdn/browser-compat-data/blob/main/api/BaseAudioContext.json)
- In iOS-Safari wechselt der Kontext auf `interrupted`, wenn der Nutzer die Seite verlässt (Tab-Wechsel, Browser in den Hintergrund, Bildschirm aus). Danach muss er fortgesetzt werden. Quelle: [MDN, BaseAudioContext.state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state)
- Die Spezifikation sagt: Lief der Kontext vor der Unterbrechung, geht er danach von selbst zurück auf `running` und meldet `statechange`. War er angehalten, gibt es aus Datenschutzgründen kein Ereignis. Quelle: [Web Audio API 1.1, Handling an interruption](https://webaudio.github.io/web-audio-api/#interruption-handling)
- WebKit setzt nach dem Ende einer Unterbrechung nur dann von selbst fort, wenn das System das Fortsetzen erlaubt und das Skript den Kontext nicht selbst mit `suspend()` angehalten hat. Sonst endet er in `suspended`. Quelle: [WebKit-Quelltext AudioContext.cpp, Funktion `mayResumePlayback`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)
- Das automatische Fortsetzen ist in der Praxis unzuverlässig. Dazu gibt es mehrere offene Fehlerberichte:
  - Kontext bleibt nach Rückkehr in den Vordergrund auf `interrupted`, gemeldet von einem WebKit-Entwickler, Status NEW. Quelle: [WebKit-Bug 281955](https://bugs.webkit.org/show_bug.cgi?id=281955). Betrifft Safari 18.
  - Kontext wird nach Rückkehr nicht verlässlich fortgesetzt, Status NEW. Ein Kommentar beschreibt `running` bei stehender `currentTime`. Quelle: [WebKit-Bug 263627](https://bugs.webkit.org/show_bug.cgi?id=263627). Betrifft iOS 17.
  - In einer Home-Bildschirm-App bleibt Web Audio nach der Rückkehr stumm, obwohl der Zustand `running` meldet, Status NEW. Ein Nutzer meldet Besserung mit iOS 26.2 Beta 3. Quelle: [WebKit-Bug 291892](https://bugs.webkit.org/show_bug.cgi?id=291892). Betrifft iOS 18 und 26.
- Safari 26.2 hat behoben, dass ein Audio-Element beim erneuten Öffnen einer Home-Bildschirm-App nicht spielte. Quelle: [Safari 26.2 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes)
- `navigator.audioSession.state` und das zugehörige `statechange` sind in WebKit hinter dem Schalter `DOMAudioSessionFullEnabled` versteckt, der abgeschaltet ist. Quelle: [WebKit-Quelltext DOMAudioSession.idl](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.idl), [UnifiedWebPreferences.yaml](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml), [MDN-Kompatibilitätsdaten AudioSession](https://github.com/mdn/browser-compat-data/blob/main/api/AudioSession.json). Stand: nicht verfügbar bis einschließlich Safari 27.2.

**Schlussfolgerung / Empfehlung**

- Unterbrechungen nur über `ctx.state` und `ctx.onstatechange` erkennen, nicht über die Audio Session API.
- Bei `visibilitychange` (sichtbar) und bei jeder Geste: Ist `ctx.state` nicht `running`, dann `resume()` aufrufen, ohne darauf zu warten.
- Töne nur auslösen, wenn `ctx.state === 'running'` ist. Im angehaltenen Zustand steht die Kontextzeit, sodass sich geplante Töne sonst stauen und beim Fortsetzen auf einmal erklingen.
- Wer den Kontext selbst mit `suspend()` anhält (etwa zum Stromsparen), muss ihn auch selbst wieder mit `resume()` starten. WebKit tut das dann nicht.
- Als Notanker für den Fall „läuft, aber stumm": prüfen, ob `ctx.currentTime` weiterzählt, und sonst `suspend()` gefolgt von `resume()` versuchen oder den Kontext neu aufbauen. Das stammt nur aus einem Nutzerkommentar und ist nicht von WebKit bestätigt.

### 1.3 Stummmodus

**Belegt**

- Spielt eine Seite nur Web Audio, wählt WebKit die Tonkategorie „Ambient". Quelle: [WebKit-Quelltext MediaSessionManagerCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm), [AudioSessionIOS.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/ios/AudioSessionIOS.mm)
- Die Kategorie „Ambient" mischt sich mit dem Ton anderer Apps. Stummschalter und Bildschirmsperre schalten sie stumm. Quelle: [Apple, AVAudioSession.Category.ambient](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient)
- Ein WebKit-Entwickler bestätigt das im Fehlerbericht: Der Standardtyp ist `ambient`, deshalb ist Web Audio bei stummgeschaltetem Gerät stumm. Seit iOS 17 lässt sich das mit dem Typ `playback` ändern. Quelle: [WebKit-Bug 237322, Kommentar 6](https://bugs.webkit.org/show_bug.cgi?id=237322)
- Sobald ein hörbares `<audio>`- oder `<video>`-Element läuft, wählt WebKit im Automatikmodus die Wiedergabe-Kategorie. Sie hat Vorrang vor Web Audio. Quelle: [WebKit-Quelltext MediaSessionManagerCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm)
- Das iPad hat einen Stummmodus: über die Glocke im Kontrollzentrum oder durch Gedrückthalten der Leiser-Taste. Musik, Podcasts, Filme und Serien schaltet er nicht stumm. Quelle: [Apple Support, iPad-Benutzerhandbuch, Lautstärke anpassen und stummschalten](https://support.apple.com/guide/ipad/adjust-the-volume-and-silence-ipad9940e758/ipados). Abgerufen am 14.11.2026; die Seite führt iPadOS 27 als neueste Version.

**Schlussfolgerung / Empfehlung**

- Ist der Stummmodus am iPad an, bleibt „Murmel" stumm, während das Hörbuch weiterläuft. Das ist kein Fehler im Spiel. Ein kurzer Hinweis im Spiel („Kein Ton? Stummmodus im Kontrollzentrum prüfen") spart Fehlersuche.
- Dass der Stummmodus des iPad genauso wirkt wie der Schalter am iPhone, ist abgeleitet. Apples Dokumentation zur Kategorie spricht nur vom Stummschalter.

### 1.4 Audio Session API

**Belegt**

- `navigator.audioSession.type` gibt es ab Safari 16.4. Apple nennt es eine Teilmenge der API. Quelle: [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes), [MDN-Kompatibilitätsdaten AudioSession](https://github.com/mdn/browser-compat-data/blob/main/api/AudioSession.json)
- Die Spezifikation ist ein Entwurf (Editor's Draft vom 13.11.2024). MDN führt die API als experimentell. Quelle: [W3C Audio Session](https://w3c.github.io/audio-session/), [MDN, Audio Session API](https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API)
- Mögliche Typen: `auto`, `playback`, `transient`, `transient-solo`, `ambient`, `play-and-record`. Quelle: [MDN, AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)
- Bei `auto` richtet sich der Typ nach den genutzten Schnittstellen: AudioContext ergibt `ambient`, Medienelemente ergeben `playback`. Quelle: [W3C Audio Session](https://w3c.github.io/audio-session/)
- So bildet WebKit die Typen auf iOS-Kategorien ab. Quelle: [WebKit-Quelltext DOMAudioSession.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp), [AudioSessionIOS.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/ios/AudioSessionIOS.mm)

  | Typ | iOS-Kategorie | Mischt mit anderen Apps | Stumm bei Stummmodus |
  |---|---|---|---|
  | `ambient` | Ambient | ja | ja |
  | `transient` | Ambient | ja | ja |
  | `transient-solo` | SoloAmbient | nein | ja |
  | `playback` | Playback, ohne Misch-Option | nein | nein |
  | `auto` | je nach genutzter Schnittstelle | – | – |

- Die Wiedergabe-Kategorie spielt trotz Stummschalter und Bildschirmsperre weiter. Sie ist ohne Zusatzoption nicht mischbar und unterbricht andere nicht mischbare Tonquellen. Quelle: [Apple, AVAudioSession.Category.playback](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playback)
- Die Kategorie „SoloAmbient" ist nicht mischbar und wird durch Stummschalter und Bildschirmsperre stumm. Quelle: [Apple, AVAudioSession.Category.soloAmbient](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/soloambient)
- Ein ausdrücklich gesetzter Typ hat in WebKit Vorrang vor der Automatik. Quelle: [WebKit-Quelltext MediaSessionManagerCocoa.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm)
- Nur mit Typ `playback` oder `play-and-record` wird ein AudioContext zur „Jetzt läuft"-Quelle des Systems. Quelle: [WebKit-Quelltext AudioContext.cpp, Funktion `isNowPlayingEligible`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)
- Das Setzen des Typs wirkt nur, wenn dem Dokument die Berechtigung `microphone` der Permissions Policy zusteht. Sonst wird der Aufruf still übergangen. Quelle: [WebKit-Quelltext DOMAudioSession.cpp, Funktion `setType`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp), [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)

**Schlussfolgerung / Empfehlung**

- Für ein Spiel, das fremde Musik und Hörbücher nicht unterbrechen soll, passt **`ambient`**. Das ist bei reinem Web Audio ohnehin der Automatik-Wert. Ausdrücklich gesetzt schützt es zusätzlich davor, dass ein späteres Medienelement die Kategorie umstellt.
- Mit `ambient` bleibt die Mediensteuerung (Kopfhörertaste, Sperrbildschirm) beim Hörbuch.
- Einen Web-Typ, der mischt und zugleich den Stummmodus ignoriert, gibt es nicht. Das folgt aus der festen Zuordnung oben.
- Ein Lautstärkeregler im Spiel ist sinnvoll, weil sich Spiel und Hörbuch die Systemlautstärke teilen.
- In der eingebetteten Sandbox-Variante wird das Setzen vermutlich übergangen. Das schadet nicht, weil die Automatik für reines Web Audio ebenfalls `ambient` ergibt.

### 1.5 Beispiel: Klang entsperren und reparieren

```ts
// audio.ts
let ctx: AudioContext | undefined;

/** Nur aus pointerup, touchend, click oder keydown aufrufen. */
export function klangEntsperren(): void {
  if (!ctx) {
    // Ab Safari 16.4 vorhanden. Fehlt die API, passiert nichts.
    const sitzung = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (sitzung) {
      try { sitzung.type = 'ambient'; } catch { /* unkritisch */ }
    }
    ctx = new AudioContext({ latencyHint: 'interactive' });
  }
  if (ctx.state !== 'running') {
    // Nicht awaiten: Ohne gültige Geste bleibt das Promise offen.
    ctx.resume().catch(() => {});
  }
}

/** Vor jedem Ton prüfen, sonst stauen sich geplante Töne. */
export function klangBereit(): boolean {
  return ctx !== undefined && ctx.state === 'running';
}

// Jede Geste ist zugleich ein Reparaturversuch.
for (const typ of ['pointerup', 'touchend', 'click', 'keydown'] as const) {
  window.addEventListener(typ, klangEntsperren, { passive: true });
}

// Rückkehr aus dem Hintergrund: Versuch ohne Geste, sonst hilft die nächste Geste.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ctx && ctx.state !== 'running') {
    ctx.resume().catch(() => {});
  }
});
```

Das Beispiel ist eine Empfehlung und nicht auf einem Gerät getestet.

---

## 2. Web-App auf dem iPad-Home-Bildschirm

### 2.1 Was eine Seite zur Web-App macht

**Belegt**

- Ab iPadOS 26 öffnet jede Website, die zum Home-Bildschirm hinzugefügt wird, standardmäßig als Web-App. Ein Manifest oder Meta-Tag ist dafür nicht mehr nötig. Der Nutzer kann „Als Web-App öffnen" beim Hinzufügen abschalten. Quelle: [WebKit-Blog, WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [Safari 26.0 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes)
- Vor iPadOS 26 öffnete eine Seite nur dann als Web-App, wenn das Manifest `display` auf `standalone` oder `fullscreen` setzte oder das Apple-Meta-Tag vorhanden war. Sonst entstand ein Lesezeichen. Quelle: [WebKit-Blog, Web Push for Web Apps (16.02.2023)](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- Das Manifest wird seit Safari 11.1 / iOS 11.3 für „Zum Home-Bildschirm" ausgewertet. Quelle: [Apple, Safari 11.1 Release Notes](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_11_1.html)
- Seit iOS 12.1 pausieren Home-Bildschirm-Seiten im Hintergrund, statt bei jeder Rückkehr neu zu laden. Quelle: [Safari 12.1 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-12_1-release-notes)
- Seit iOS 16.4 bieten auch andere Browser „Zum Home-Bildschirm" an. Quelle: [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)

### 2.2 Manifest-Felder auf iPadOS

**Belegt**

| Feld | Stand in iPadOS-Safari | Quelle |
|---|---|---|
| `display: standalone`, `browser` | unterstützt ab 11.3 | [MDN-Daten display](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/display.json) |
| `display: fullscreen` | nicht unterstützt; fällt laut Spezifikation auf `standalone` zurück | [MDN-Daten display](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/display.json), [W3C Web App Manifest, Display modes](https://www.w3.org/TR/appmanifest/), [web.dev, App design](https://web.dev/learn/pwa/app-design) |
| `display: minimal-ui` | nicht unterstützt | [web.dev, App design](https://web.dev/learn/pwa/app-design) |
| `orientation` | nicht unterstützt | [MDN-Daten orientation](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/orientation.json) |
| `icons` | ab 15.4, aber nur, wenn kein `apple-touch-icon` da ist und `purpose` fehlt oder `any` ist | [Safari 15.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-15_4-release-notes) |
| `theme_color` | laut MDN ab 15 | [MDN-Daten theme_color](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/theme_color.json) |
| `background_color` | wird ignoriert | [web.dev, Web app manifest](https://web.dev/learn/pwa/web-app-manifest), [MDN-Daten background_color](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/background_color.json) |
| `start_url`, `scope`, `name`, `short_name` | ab 11.3 | [MDN-Daten Manifest](https://github.com/mdn/browser-compat-data/tree/main/manifests/webapp) |
| `id` | ab 16.4 | [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes) |
| `shortcuts` | nicht auf iOS/iPadOS (nur macOS ab 17.4) | [MDN-Daten shortcuts](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/shortcuts.json) |

- `start_url` und `scope` werden relativ zur Adresse des Manifests aufgelöst. Fehlt `id`, gilt die Start-Adresse. Quelle: [W3C Web App Manifest](https://www.w3.org/TR/appmanifest/). Gilt browserunabhängig.
- Die Ausrichtung lässt sich auch per Skript nicht sperren: `screen.orientation.lock()` gibt es in Safari nicht. Quelle: [MDN-Daten ScreenOrientation](https://github.com/mdn/browser-compat-data/blob/main/api/ScreenOrientation.json), [WebKit-Blog, WebKit Features in Safari 16.4](https://webkit.org/blog/13966/webkit-features-in-safari-16-4/)
- Safari erzeugt aus dem Manifest kein Startbild. Quelle: [web.dev, Web app manifest](https://web.dev/learn/pwa/web-app-manifest)

**Unklar**

- WebKit liest das Feld `orientation` zwar ein, aber keine Apple-Quelle sagt, dass iPadOS es anwendet. Quelle: [WebKit-Quelltext ApplicationManifestParser.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/applicationmanifest/ApplicationManifestParser.cpp)
- Welche Wirkung `theme_color` in der Home-Bildschirm-App auf dem iPad hat, steht in keiner Apple-Quelle. Die MDN-Notiz, die Farbe gelte ab Safari 26 nur noch für installierte Web-Apps, ist in der dortigen Diskussion umstritten. Quelle: [MDN-Daten meta](https://github.com/mdn/browser-compat-data/blob/main/html/elements/meta.json), [WebKit-Bug 301756](https://bugs.webkit.org/show_bug.cgi?id=301756)
- Welche `display-mode`-Abfrage in der installierten App zutrifft, ist widersprüchlich: Laut MDN-Daten trifft bei `display: standalone` die Abfrage `fullscreen` zu und `standalone` nicht. Der zugehörige Fehlerbericht ist offen und unbeantwortet. Quelle: [MDN-Daten media](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json), [WebKit-Bug 264218](https://bugs.webkit.org/show_bug.cgi?id=264218)

**Schlussfolgerung / Empfehlung**

- `display: "standalone"` schreiben. Das ist der Wert, den iPadOS tatsächlich anwendet.
- Das Spiel muss Hoch- und Querformat können und auf Größenänderungen reagieren, weil sich die Ausrichtung nicht sperren lässt.
- `start_url` und `scope` relativ angeben (`"./"`), dann stimmen sie auch unter `https://<USER>.github.io/<REPO>/`. `id` weglassen.
- Zum Erkennen der installierten App beide Abfragen prüfen: `(display-mode: standalone), (display-mode: fullscreen)`, zusätzlich `navigator.standalone`.

```json
{
  "name": "Murmel",
  "short_name": "Murmel",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#101418",
  "theme_color": "#101418",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 2.3 Apple-eigene Tags

**Belegt**

| Tag | Stand | Quelle |
|---|---|---|
| `apple-mobile-web-app-capable` | ab iPadOS 26 überflüssig; davor nur nötig, wenn kein Manifest mit `display: standalone` da ist; web.dev rät von diesen Meta-Tags ab | [WebKit-Blog, Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [web.dev, Web app manifest](https://web.dev/learn/pwa/web-app-manifest) |
| `<link rel="apple-touch-icon">` | weiter sinnvoll: hat Vorrang vor Manifest-Icons; ohne Icon nimmt iOS ein Bildschirmfoto der Seite | [WebKit-Blog, Web Push for Web Apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [web.dev, Installation](https://web.dev/learn/pwa/installation) |
| `apple-mobile-web-app-status-bar-style` | `default` und `black`: Inhalt beginnt unter der Statusleiste; `black-translucent`: Inhalt füllt den ganzen Bildschirm und liegt teils unter der Statusleiste | [Apple, Supported Meta Tags (Archiv, 2014)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html) |
| `apple-mobile-web-app-title` | setzt den Namen unter dem Symbol; sonst gilt `<title>` | [Apple, Configuring Web Applications (Archiv, 2016)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) |
| `<link rel="apple-touch-startup-image">` | optionales Startbild; sonst zeigt iOS ein Bildschirmfoto vom letzten Start | [Apple, Configuring Web Applications (Archiv, 2016)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) |

- Apples Beispiel nennt als Icon-Größen 180×180 (iPhone Retina), 167×167 (iPad Retina) und 152×152 (iPad). Quelle: [Apple, Configuring Web Applications (Archiv, 2016)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html). Die Angabe ist alt.
- Der Statusleisten-Stil wirkt weiterhin. Laut Fehlerberichten wird er beim Hinzufügen festgehalten und ändert sich erst nach erneutem Hinzufügen. Quelle: [WebKit-Bug 260508](https://bugs.webkit.org/show_bug.cgi?id=260508), [WebKit-Bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008). Betrifft iOS 17 bis 26.
- Ohne dieses Tag meldet eine Home-Bildschirm-App unter iOS 26 laut offenem Fehlerbericht falsche Werte für `100vh` und `100lvh`, und die Seite lässt sich scrollen. Quelle: [WebKit-Bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008). Status NEW, gemeldet am 01.06.2026.

**Schlussfolgerung / Empfehlung**

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Murmel">
<!-- Nur für iPadOS vor 26 ohne Manifest nötig, schadet aber nicht: -->
<meta name="apple-mobile-web-app-capable" content="yes">
```

- Das `apple-touch-icon` ohne Transparenz und quadratisch anlegen.
- Den Statusleisten-Stil vor dem ersten Hinzufügen festlegen. Nach einer Änderung muss der Auftraggeber die App löschen und neu hinzufügen.

### 2.4 Sichere Bereiche

**Belegt**

- `viewport-fit=cover` im Viewport-Meta-Tag lässt die Seite den ganzen Bildschirm belegen. Gilt ab iOS 11. Quelle: [WebKit-Blog, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- Die Abstände stehen in `env(safe-area-inset-top)`, `-right`, `-bottom`, `-left`. `env()` gilt ab iOS 11.2, davor hieß es `constant()`. Quelle: [WebKit-Blog, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/), [MDN-Daten env](https://github.com/mdn/browser-compat-data/blob/main/css/types/env.json)
- Seit iOS 26.1 bleibt in Home-Bildschirm-Apps laut Fehlerbericht eine Statusleiste sichtbar, und `env(safe-area-inset-top)` meldete zeitweise 0. Der Bericht galt mit 26.2 als behoben, wurde am 04.08.2026 für iOS 27 Beta wieder geöffnet und hat einen Nutzerkommentar zu iOS 27.2 vom 10.11.2026. Ein Kommentar nennt Canvas-basierte Frameworks als betroffen. Quelle: [WebKit-Bug 301994](https://bugs.webkit.org/show_bug.cgi?id=301994). Status REOPENED.
- In installierten Apps mit `viewport-fit=cover` ziehen `100svh`, `-webkit-fill-available` und `visualViewport.height` laut offenem Fehlerbericht den sicheren Bereich ab. Quelle: [WebKit-Bug 254868](https://bugs.webkit.org/show_bug.cgi?id=254868). Status NEW, zuletzt bestätigt für iOS 18.3.1.
- In Safari-Tabs wirkt `viewport-fit=cover` im Hochformat bewusst nicht nach oben und unten. Ein WebKit-Entwickler nennt das derzeit nötig für die Verträglichkeit mit bestehenden Seiten. Quelle: [WebKit-Bug 306465, Kommentar 4](https://bugs.webkit.org/show_bug.cgi?id=306465). Betrifft Safari 26.

**Schlussfolgerung / Empfehlung**

- Den oberen Streifen als reinen Hintergrund behandeln. Nichts Bedienbares und nichts Wichtiges dort hinlegen.
- Die Canvas-Größe nicht aus Viewport-Einheiten ableiten, sondern die tatsächliche Größe des Elements messen (siehe 3.4).
- Bedienelemente mit `max(12px, env(safe-area-inset-*))` einrücken.

### 2.5 Service Worker und Offline-Betrieb

**Belegt**

- Service Worker gibt es seit Safari 11.1 / iOS 11.3. Quelle: [Apple, Safari 11.1 Release Notes](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_11_1.html)
- Sie stehen in Safari, im Safari-View-Controller und in Web-Apps auf dem Home-Bildschirm bereit. Quelle: [WebKit-Blog, Workers at Your Service (07.02.2018)](https://webkit.org/blog/8090/workers-at-your-service/)
- Ungenutzte Registrierungen und Caches entfernt WebKit nach einigen Wochen. Quelle: [WebKit-Blog, Workers at Your Service](https://webkit.org/blog/8090/workers-at-your-service/). Die Angabe ist von 2018.
- Service Worker gibt es nur in sicheren Kontexten, also über HTTPS. Quelle: [MDN, Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- GitHub Pages liefert `github.io`-Seiten über HTTPS aus. Quelle: [GitHub Docs, Securing your GitHub Pages site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)

**Schlussfolgerung / Empfehlung**

- Offline-Betrieb ist in der Home-Bildschirm-App möglich. Der Geltungsbereich des Service Workers ist auf einer Projektseite `/<REPO>/`.

### 2.6 Speicher

**Belegt**

- Safari löscht per Skript angelegte Daten einer Website nach sieben Tagen Safari-Nutzung ohne Nutzerinteraktion mit dieser Website. Als Interaktion zählen Tippen, Klicken und Tastatureingabe, Scrollen nicht. Betroffen sind IndexedDB, LocalStorage, SessionStorage, Media Keys sowie Service-Worker-Registrierungen und -Caches. Gilt ab iOS 13.4 / Safari 13.1. Quelle: [WebKit-Blog, Full Third-Party Cookie Blocking and More (24.03.2020)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/), [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)
- Die eigene Domain einer Home-Bildschirm-App ist von dieser 7-Tage-Grenze ausgenommen. Quelle: [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/)
- Die Daten einer Home-Bildschirm-App sind von Safari getrennt. Quelle: [WebKit, Tracking Prevention](https://webkit.org/tracking-prevention/), [web.dev, Installation](https://web.dev/learn/pwa/installation)
- Seit iOS 17.2 werden beim Hinzufügen zum Home-Bildschirm die Cookies kopiert. Von anderem Speicher ist dort keine Rede. Quelle: [Safari 17.2 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-17_2-release-notes)
- Dieselbe Seite lässt sich mehrfach hinzufügen. Jede Kopie hat eigenen Speicher. Quelle: [web.dev, Installation](https://web.dev/learn/pwa/installation)
- Seit Safari 17 darf eine Herkunft bis etwa 60 % des Datenträgers belegen. Das gilt auch für Home-Bildschirm-Apps. Quelle: [WebKit-Blog, Updates to Storage Policy (10.08.2023)](https://webkit.org/blog/14403/updates-to-storage-policy/)
- Bei Speicherknappheit kann WebKit Daten löschen, zuerst die am längsten ungenutzten. Ausgenommen sind Herkünfte im dauerhaften Modus. Quelle: [WebKit-Blog, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- `navigator.storage.persist()` beantragt den dauerhaften Modus (ab Safari 15.2). WebKit entscheidet nach Anhaltspunkten, etwa ob die Seite als Home-Bildschirm-App geöffnet ist. Quelle: [WebKit-Blog, Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [MDN-Daten StorageManager](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json)

**Schlussfolgerung / Empfehlung**

- Ein in Safari begonnener Spielstand ist in der Home-Bildschirm-App nicht da. Das Spiel am besten gleich als App hinzufügen.
- In der App einmal `navigator.storage.persist()` aufrufen.
- Den Spielstand bei `visibilitychange` (verborgen) und `pagehide` sichern, weil iPadOS die pausierte App jederzeit beenden kann.
- Wer nur im Safari-Tab spielt und länger als 7 Tage pausiert, kann den Spielstand verlieren.

---

## 3. Touch und Darstellung

### 3.1 Zoom, Auswahl, Callout, Gummiband

**Belegt**

- `touch-action: none` verbietet dem Browser, bei Berührungen auf dem Element den Ausschnitt zu verschieben oder zu zoomen. `manipulation` erlaubt Verschieben und Zwei-Finger-Zoom, aber keinen Doppeltipp-Zoom. Quelle: [W3C Pointer Events 3, Empfehlung vom 30.06.2026](https://www.w3.org/TR/pointerevents3/). Safari: `manipulation` ab iOS 9.3, `none`, `pan-x`, `pan-y`, `pinch-zoom` ab 13. Quelle: [MDN-Daten touch-action](https://github.com/mdn/browser-compat-data/blob/main/css/properties/touch-action.json)
- `touch-action` wird nicht vererbt und wirkt nicht in eingebettete Seiten hinein. Quelle: [W3C Pointer Events 3](https://www.w3.org/TR/pointerevents3/)
- WebKit wartet bei `touch-action: manipulation` nicht mehr auf einen zweiten Tipp und meldet Tipps sofort. Quelle: [WebKit-Blog, More Responsive Tapping on iOS (15.12.2015)](https://webkit.org/blog/5610/more-responsive-tapping-on-ios/)
- Safari erlaubt den Zwei-Finger-Zoom immer und ignoriert `user-scalable`. Gilt ab iOS 10. Quelle: [Apple, What's New in Safari 10](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_10_0.html)
- `user-select` ohne Präfix kommt erst mit Safari 27.3 (Beta). Bis 27.2 gilt nur `-webkit-user-select`. Quelle: [Safari 27.3 Beta Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-27_3-release-notes), [MDN-Daten user-select](https://github.com/mdn/browser-compat-data/blob/main/css/properties/user-select.json)
- `-webkit-touch-callout: none` schaltet das Menü ab, das iOS-Safari bei langem Drücken zeigt. Die Eigenschaft ist nicht standardisiert und nur in iOS-Safari vorhanden. Quelle: [MDN, -webkit-touch-callout](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-touch-callout), [MDN-Daten](https://github.com/mdn/browser-compat-data/blob/main/css/properties/-webkit-touch-callout.json)
- `overscroll-behavior` gibt es ab Safari 16.0. Quelle: [Safari 16 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16-release-notes)
- Seit Safari 16.4 verhindert `overscroll-behavior: none` das Überscrollen auch dann, wenn die Seite zu klein zum Scrollen ist. Quelle: [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)
- Auf Scroll-Containern ohne überlaufenden Inhalt wirkt die Eigenschaft in Safari weiterhin nicht. Quelle: [MDN-Daten overscroll-behavior](https://github.com/mdn/browser-compat-data/blob/main/css/properties/overscroll-behavior.json), [WebKit-Bug 243452](https://bugs.webkit.org/show_bug.cgi?id=243452). Status NEW.
- Gegen das Herunterziehen zum Neuladen hilft `overscroll-behavior` in iOS-Safari laut Fehlerbericht nicht. Ein WebKit-Mitarbeiter lässt offen, ob das Absicht ist. Quelle: [WebKit-Bug 275947](https://bugs.webkit.org/show_bug.cgi?id=275947). Status NEW, bestätigt für iOS 18 Beta.
- Touch-Listener auf dem Wurzeldokument sind seit Safari 11.1 standardmäßig passiv. `preventDefault()` wirkt darin nicht, außer man setzt `passive: false`. Quelle: [Apple, Safari 11.1 Release Notes](https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_11_1.html), [MDN, addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- Safari kennt zusätzlich die eigenen Ereignisse `gesturestart` und `gesturechange`. Quelle: [MDN-Daten Element](https://github.com/mdn/browser-compat-data/blob/main/api/Element.json). Nur iOS-Safari, nicht standardisiert.

**Schlussfolgerung / Empfehlung**

- Der verlässlichste Weg ist die Kombination: Die Seite gar nicht scrollbar machen, `touch-action: none` auf das Canvas und auf `html` und `body`, dazu die Auswahl- und Callout-Regeln.
- Da das Canvas den ganzen Bildschirm füllt und `touch-action: none` trägt, kann daraus keine Verschiebegeste entstehen. Damit entfallen Gummiband und Herunterziehen zum Neuladen. Das ist aus der Spezifikation abgeleitet, nicht von WebKit bestätigt.
- Als zweite Sicherung `touchmove` mit `passive: false` abfangen.

```css
html, body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none;            /* ab Safari 16, verlässlich ab 16.4 */
  touch-action: none;                   /* ab Safari 13 */
  -webkit-user-select: none;            /* bis Safari 27.2 nötig */
  user-select: none;                    /* ab Safari 27.3 */
  -webkit-touch-callout: none;          /* nur iOS-Safari */
  -webkit-tap-highlight-color: transparent;
  background: #101418;
}
canvas#spiel {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
.bedienung {
  padding: max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right))
           max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left));
}
```

```ts
// Zweite Sicherung, falls doch eine Verschiebegeste beginnt.
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
// Nur Safari: Zwei-Finger-Zoom abfangen.
document.addEventListener('gesturestart', (e) => e.preventDefault());
```

### 3.2 Pointer Events auf dem Canvas

**Belegt**

- Pointer Events gibt es ab Safari 13 für Maus, Trackpad, Finger und Apple Pencil. Quelle: [Safari 13 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes)
- Übernimmt der Browser eine Berührung zum Verschieben oder Zoomen, sendet er `pointercancel`, und die Ereignisfolge endet. Quelle: [W3C Pointer Events 3](https://www.w3.org/TR/pointerevents3/)
- Bei direkter Eingabe wie Finger wird der Zeiger ab `pointerdown` von selbst an das Zielelement gebunden. Quelle: [W3C Pointer Events 3, Implicit pointer capture](https://www.w3.org/TR/pointerevents3/)
- `getCoalescedEvents()` und `getPredictedEvents()` gibt es ab Safari 18.2. Quelle: [Safari 18.2 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-18_2-release-notes). Seit 18.3 tragen diese Teilereignisse dieselbe Zeigerkennung wie das Hauptereignis. Quelle: [Safari 18.3 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-18_3-release-notes)
- Seit Safari 26.2 liefern Pointer- und Touch-Ereignisse Koordinaten mit Nachkommastellen. Maus-Ereignisse bleiben ganzzahlig. Quelle: [Safari 26.2 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes)
- Erst seit Safari 27.0 unterdrückt `preventDefault()` in `pointerdown` auf iOS zuverlässig die nachgelieferten `mousedown`- und `mouseup`-Ereignisse. Quelle: [Safari 27 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes)
- Safari auf dem iPad lädt seit Version 13 standardmäßig die Desktop-Fassung von Websites. Quelle: [Safari 13 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes)

**Schlussfolgerung / Empfehlung**

- Ohne `touch-action: none` bricht ein Ziehen auf dem Canvas mit `pointercancel` ab. `pointercancel` immer wie `pointerup` behandeln.
- Mehrere Finger über `pointerId` auseinanderhalten.
- Auf Versionen vor 27.0 nicht davon ausgehen, dass `preventDefault()` die Maus-Ereignisse unterdrückt. Am einfachsten nur Pointer-Ereignisse abonnieren und keine Maus-Ereignisse.
- Das iPad nicht über die Browserkennung erkennen, sondern Fähigkeiten prüfen. WebKit empfiehlt das ausdrücklich. Quelle: [WebKit-Blog, Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

### 3.3 Canvas-Größe und Speicher

**Belegt**

- WebKit begrenzt die Canvas-Fläche in Gerätepixeln. Auf iOS und iPadOS gilt seit Safari 18.0: Breite mal Höhe höchstens 8192 × 8192 (67.108.864 Pixel). Quelle: [WebKit-Quelltext CanvasBase.cpp, Tag der 18.0-Linie](https://github.com/WebKit/WebKit/blob/WebKit-7619.1.24/Source/WebCore/html/CanvasBase.cpp), [WebKit-Änderung 276145@main vom 15.03.2024](https://commits.webkit.org/276145@main), [WebKit-Bug 271002](https://bugs.webkit.org/show_bug.cgi?id=271002)
- Bis einschließlich Safari 17.5 lag die Grenze bei 4096 × 4096 (16.777.216 Pixel). Quelle: [WebKit-Quelltext CanvasBase.cpp, Tag der 17.5-Linie](https://github.com/WebKit/WebKit/blob/WebKit-7618.2.11/Source/WebCore/html/CanvasBase.cpp)
- Bei Überschreitung gibt WebKit eine Warnung in der Konsole aus, und die Flächenprüfung des Canvas schlägt fehl. Quelle: [WebKit-Quelltext CanvasBase.cpp, Funktion `validateArea`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CanvasBase.cpp)
- Früher gab es zusätzlich eine Obergrenze für den gesamten Canvas-Speicher (auf iOS ein Viertel des Arbeitsspeichers). Sie wurde mit Safari 17.0 entfernt. Seitdem gelten nur die allgemeinen Speichergrenzen des Systems, und eine Seite kann eher abstürzen als eine Fehlermeldung bekommen. Quelle: [WebKit-Änderung 265628@main vom 29.06.2023](https://commits.webkit.org/265628@main), [WebKit-Bug 195325](https://bugs.webkit.org/show_bug.cgi?id=195325), [Safari 17 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes)
- `ResizeObserverEntry.devicePixelContentBoxSize` gibt es in Safari nicht. Quelle: [MDN-Daten ResizeObserverEntry](https://github.com/mdn/browser-compat-data/blob/main/api/ResizeObserverEntry.json)
- Die Option `alpha` von `getContext('2d')` unterstützt Safari laut MDN-Daten nicht. Quelle: [MDN-Daten HTMLCanvasElement](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLCanvasElement.json)

**Unklar**

- Eine feste Zahl für die Speichergrenze eines Web-Prozesses auf dem iPad nennt keine Quelle.

**Schlussfolgerung / Empfehlung**

- Ein bildschirmfüllendes Canvas auf dem iPad liegt weit unter der Grenze. Kritisch wären nur sehr große Zwischenspeicher-Canvases.
- Größe selbst berechnen: gemessene CSS-Größe mal `devicePixelRatio`, gerundet.
- Wenige, wiederverwendete Canvases halten. Nicht mehr gebrauchte auf Breite und Höhe 0 setzen.

```ts
function canvasAnpassen(canvas: HTMLCanvasElement, c: CanvasRenderingContext2D): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  const b = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== b || canvas.height !== h) {
    canvas.width = b;
    canvas.height = h;
  }
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(() => canvasAnpassen(canvas, c)).observe(canvas);
```

### 3.4 Bildrate

**Belegt**

- WebKit hat die Einstellung „Prefer Page Rendering Updates near 60fps". Sie ist als stabil markiert und außer auf visionOS eingeschaltet. Sie hält Seitenaktualisierungen nahe 60 Bildern pro Sekunde, statt der Bildwiederholrate des Displays zu folgen. Quelle: [WebKit-Quelltext UnifiedWebPreferences.yaml](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml). Stand: `main`, 14.11.2026.
- Als Gründe nennt WebKit höheren Stromverbrauch und Seiten, die bei anderen Raten falsch liefen. Quelle: [WebKit-Explainer, Animation frame rate](https://webkit.github.io/explainers/animation-frame-rate)
- Auf die halbe Rate (30 Bilder pro Sekunde) drosselt WebKit im Stromsparmodus, bei starker Erwärmung und in fremden eingebetteten Seiten, mit denen der Nutzer noch nicht interagiert hat. Außerhalb des sichtbaren Bereichs wird fast ganz angehalten. Quelle: [WebKit-Quelltext AnimationFrameRate.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp)
- Der Wunsch nach 120 Hz für `requestAnimationFrame` ist seit 2017 offen. Quelle: [WebKit-Bug 173434](https://bugs.webkit.org/show_bug.cgi?id=173434). Status NEW.
- Für Home-Bildschirm-Apps berichtet ein WebKit-Entwickler 60 Bilder pro Sekunde mit Standardeinstellungen. Ein Nutzer berichtet 120, nachdem er die Einstellung abgeschaltet hat. Quelle: [WebKit-Bug 294338, Kommentare 6 und 7](https://bugs.webkit.org/show_bug.cgi?id=294338). Betrifft iOS 26.

**Schlussfolgerung / Empfehlung**

- Auf ProMotion-iPads läuft `requestAnimationFrame` in der Voreinstellung mit etwa 60 Hz. Die Seite kann 120 Hz nicht selbst anfordern.
- Bewegung aus der verstrichenen Zeit berechnen und große Zeitsprünge kappen. Dann stimmt das Tempo bei 30, 60 und 120.
- Für ein ruhiges Spiel sind 60 Hz kein Nachteil.

---

## 4. Haptik und Wachbleiben

### 4.1 Haptik

**Belegt**

- `navigator.vibrate()` gibt es in Safari nicht. Quelle: [MDN-Daten Navigator](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json). Stand: bis einschließlich Safari 27.2.
- WebKit lehnt die Vibration API ab. Genannt werden zu geringe Ausdruckskraft, Missbrauch als Benachrichtigung, Stromverbrauch und fehlende Umsetzbarkeit auf Apple-Plattformen. Am 12.11.2026 verwies ein WebKit-Vertreter auf einen neueren Vorschlag („web-haptics"), zu dem WebKit noch keine Position hat. Quelle: [WebKit standards-positions #267](https://github.com/WebKit/standards-positions/issues/267)
- `<input type="checkbox" switch>` gibt es ab Safari 17.4. Quelle: [Safari 17.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-17_4-release-notes)
- Seit Safari 18.0 gibt dieser Schalter auf iOS beim Umschalten eine haptische Rückmeldung. Der WebKit-Blog beschreibt das für das iPhone. Quelle: [Safari 18 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-18-release-notes), [WebKit-Blog, WebKit Features in Safari 18.0](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/)
- WebKit löst diese Rückmeldung bei einem Klick nur aus, wenn gerade eine Nutzergeste verarbeitet wird. Quelle: [WebKit-Quelltext CheckboxInputType.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CheckboxInputType.cpp)
- Technisch ist es ein leichter Impuls über den System-Rückmeldungsgeber. Quelle: [WebKit-Quelltext PageClientImplIOS.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/PageClientImplIOS.mm)
- Für das iPad nennt Apple als Haptik-Quellen nur den Apple Pencil Pro und manche Trackpads. Quelle: [Apple Human Interface Guidelines, Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)

**Schlussfolgerung / Empfehlung**

- Auf dem iPad gibt es aus dem Web praktisch keine Haptik. Die Vibration API fehlt, und das iPad selbst hat laut Apples Gestaltungsrichtlinien keinen eigenen Haptik-Geber.
- Der Schalter-Trick (versteckten Schalter per Skript anklicken) ist ein undokumentierter Nebeneffekt, an eine Geste gebunden und auf dem iPad vermutlich wirkungslos. Nicht darauf bauen.
- Das Einrasten der Murmeln über Klang und Bild spürbar machen.

### 4.2 Bildschirm wach halten

**Belegt**

- Die Screen Wake Lock API gibt es ab Safari 16.4. Quelle: [Safari 16.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes)
- In Home-Bildschirm-Apps funktionierte sie zunächst nicht. Behoben wurde das mit Safari 18.4 / iPadOS 18.4 (31.03.2025). Quelle: [Safari 18.4 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes), [WebKit-Bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545), [MDN-Daten WakeLock](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)
- Safari 17.0 behob, dass die Sperre nach einem Sichtbarkeitswechsel verweigert wurde. Quelle: [Safari 17 Release Notes](https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes)
- Die Sperre wird freigegeben, sobald das Dokument verborgen ist. Eine Anfrage bei verborgenem Dokument wird abgelehnt. Eine Nutzergeste verlangt die Spezifikation nicht. Quelle: [W3C Screen Wake Lock, Arbeitsentwurf vom 11.11.2026](https://www.w3.org/TR/screen-wake-lock/)
- Nach der Freigabe muss die Seite eine neue Sperre anfordern. MDN empfiehlt das bei `visibilitychange`. Die Anfrage kann auch wegen Stromsparmodus oder niedrigem Akkustand scheitern. Quelle: [MDN, Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- In fremden eingebetteten Seiten ist die API ohne `allow="screen-wake-lock"` gesperrt. Quelle: [W3C Screen Wake Lock](https://www.w3.org/TR/screen-wake-lock/)

**Schlussfolgerung / Empfehlung**

- Zuverlässig in der Home-Bildschirm-App ist die Sperre ab iPadOS 18.4. Im Safari-Tab ab 17.0.
- Ein Scheitern still hinnehmen. Das Spiel funktioniert auch ohne.

```ts
let sperre: WakeLockSentinel | null = null;

async function wachHalten(): Promise<void> {
  if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
  try {
    sperre = await navigator.wakeLock.request('screen');
    sperre.addEventListener('release', () => { sperre = null; });
  } catch {
    // Abgelehnt, etwa im Stromsparmodus: ohne Sperre weitermachen.
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && sperre === null) void wachHalten();
});
```

---

## 5. Auslieferung über GitHub Pages

### 5.1 Empfohlener Weg

**Belegt**

- Vite beschreibt drei Schritte: `base` setzen, in den Repository-Einstellungen unter „Pages" als Quelle „GitHub Actions" wählen, einen Workflow anlegen. Quelle: [Vite, Deploying a Static Site, GitHub Pages](https://vite.dev/guide/static-deploy#github-pages). Stand: Vite 8.3.7.
- `base` ist `'/'` für `https://<USER>.github.io/` und `'/<REPO>/'` für `https://<USER>.github.io/<REPO>/`. Quelle: [Vite, Deploying a Static Site](https://vite.dev/guide/static-deploy#github-pages)
- `base` lässt sich auch beim Bauen übergeben (`vite build --base=...`). Zur Laufzeit zusammengesetzte Adressen brauchen `import.meta.env.BASE_URL`. Quelle: [Vite, Building for Production, Public Base Path](https://vite.dev/guide/build#public-base-path)
- Ist der Pfad vorab nicht bekannt, erlaubt Vite eine relative Basis mit `base: './'` oder `''`. Quelle: [Vite, Building for Production, Relative base](https://vite.dev/guide/build#relative-base)
- Der Beispiel-Workflow von Vite nutzt `actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact` mit `path: './dist'` und `actions/deploy-pages`. Vite heftet die Actions an Commit-Kennungen und nennt die Hauptversion im Kommentar. Quelle: [Vite, Beispiel-Workflow im Repository](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml)
- Nötige Rechte: `pages: write` für die Veröffentlichung und `id-token: write` zum Nachweis der Herkunft der Veröffentlichung. Die Beispiele von Vite und GitHub setzen zusätzlich `contents: read`. Quelle: [actions/deploy-pages, README](https://github.com/actions/deploy-pages), [GitHub Docs, Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [Vite, Beispiel-Workflow](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml)
- Der Veröffentlichungs-Job braucht eine Umgebung. Üblich ist `github-pages`, sie wird bei Bedarf automatisch angelegt. GitHub empfiehlt eine Schutzregel, damit nur der Hauptzweig veröffentlichen darf. Quelle: [GitHub Docs, Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- `upload-pages-artifact` lässt seit Version 4 versteckte Dateien (mit Punkt am Anfang) weg. Seit Version 5 gibt es dafür die Eingabe `include-hidden-files`. Quelle: [actions/upload-pages-artifact, Releases](https://github.com/actions/upload-pages-artifact/releases)
- `configure-pages` liefert unter anderem die Ausgabe `base_path` (zum Beispiel `/mein-repo` oder leer). Quelle: [actions/configure-pages, action.yml](https://github.com/actions/configure-pages/blob/main/action.yml)
- Vite baut standardmäßig für Safari ab 16.4. Quelle: [Vite, Building for Production, Browser Compatibility](https://vite.dev/guide/build#browser-compatibility). Stand: Vite 8.

### 5.2 Aktuelle Versionen der Actions

**Belegt** (abgefragt am 14.11.2026 über die Release-Listen)

| Action | Neueste Version | Veröffentlicht | Haupt-Tag | Quelle |
|---|---|---|---|---|
| `actions/checkout` | v7.0.1 | 20.07.2026 | `v7` | [Releases](https://github.com/actions/checkout/releases) |
| `actions/setup-node` | v7.1.0 | 08.10.2026 | `v7` | [Releases](https://github.com/actions/setup-node/releases) |
| `actions/configure-pages` | v6.0.0 | 25.03.2026 | `v6` | [Releases](https://github.com/actions/configure-pages/releases) |
| `actions/upload-pages-artifact` | v5.0.0 | 10.04.2026 | `v5` | [Releases](https://github.com/actions/upload-pages-artifact/releases) |
| `actions/deploy-pages` | v5.0.1 | 01.09.2026 | `v5` | [Releases](https://github.com/actions/deploy-pages/releases) |

- Die beweglichen Haupt-Tags `v7`, `v7`, `v6`, `v5`, `v5` existieren in allen fünf Repositories. Quelle: Tag-Listen der jeweiligen Repositories, siehe Links in der Tabelle.
- Vites Beispiel nutzt genau diese Hauptversionen. Quelle: [Vite, Beispiel-Workflow](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml)
- `configure-pages` v6 und `deploy-pages` v5 laufen auf Node 24. Quelle: [actions/configure-pages, action.yml](https://github.com/actions/configure-pages/blob/main/action.yml), [actions/deploy-pages, Releases](https://github.com/actions/deploy-pages/releases)

**Widerspruch zwischen Quellen**

- Die Beispiele in den GitHub Docs zeigen noch ältere Stände (`checkout@v6`, `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`). Auch die READMEs von `deploy-pages` und `upload-pages-artifact` nennen noch `@v4` und `@v3`. Quelle: [GitHub Docs, Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [actions/deploy-pages, README](https://github.com/actions/deploy-pages). Maßgeblich sind die Release-Listen.

### 5.3 Workflow-Gerüst

**Schlussfolgerung / Empfehlung** (angelehnt an Vites Beispiel, nicht ausgeführt)

```yaml
# .github/workflows/deploy.yml
name: Auf GitHub Pages veröffentlichen

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: lts/*
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
      - id: deployment
        uses: actions/deploy-pages@v5
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/<REPO>/', // oder './', wenn derselbe Build auch eingebettet laufen soll
});
```

- Mit `base: './'` taugt derselbe Build für GitHub Pages und für die eingebettete Variante. Das ist laut Vite zulässig, aber von mir nicht ausprobiert.
- Wer die Actions wie Vite an Commit-Kennungen heftet, ist gegen nachträglich verschobene Tags geschützt.

### 5.4 Private Repositories

**Belegt**

- Gehört das Repository einem Konto mit GitHub Free, muss es für Pages öffentlich sein. Quelle: [GitHub Docs, Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- GitHub Free nennt Pages nur für öffentliche Repositories. GitHub Pro und GitHub Team führen Pages auch für private Repositories. Quelle: [GitHub Docs, GitHub's plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)
- Eine Pages-Seite ist öffentlich im Internet erreichbar, auch wenn das Repository privat ist. Quelle: [GitHub Docs, Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- Eine nicht öffentliche Veröffentlichung geht nur für Organisationen mit GitHub Enterprise Cloud. Quelle: [GitHub Docs, Changing the visibility of your GitHub Pages site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
- Grenzen: Seite höchstens 1 GB, weiche Grenze 100 GB Datenverkehr im Monat, Veröffentlichung bricht nach 10 Minuten ab. Die Grenze von 10 Builds pro Stunde gilt nicht für eigene Actions-Workflows. Quelle: [GitHub Docs, GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

**Schlussfolgerung / Empfehlung**

- Privates Repository plus Pages geht nur mit einem bezahlten Plan. Die Seite selbst bleibt trotzdem für jeden mit der Adresse offen. Für ein Spiel ist das unkritisch, Quelltext und Verlauf bleiben privat.

---

## 6. Nebenbefunde zur eingebetteten Sandbox-Variante

Das war nicht ausdrücklich gefragt, fiel aber in denselben Quellen an.

**Belegt**

- Ohne `allow-same-origin` gilt die eingebettete Seite als von einer besonderen Herkunft, die jede Gleichheitsprüfung verfehlt. Das kann den Zugriff auf Speicher und manche Schnittstellen verhindern. Ohne `allow-scripts` laufen keine Skripte. Quelle: [MDN, iframe, Attribut sandbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
- Der Zugriff auf `localStorage` und `sessionStorage` wirft bei undurchsichtiger Herkunft einen `SecurityError`. Quelle: [HTML-Spezifikation, Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)
- `touch-action` der einbettenden Seite wirkt nicht in die eingebettete Seite hinein. Quelle: [W3C Pointer Events 3](https://www.w3.org/TR/pointerevents3/)
- `requestAnimationFrame` läuft in einer fremden eingebetteten Seite mit halber Rate, bis der Nutzer mit ihr interagiert. Quelle: [WebKit-Quelltext AnimationFrameRate.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp)
- Die Bildschirmsperre braucht `allow="screen-wake-lock"` am `iframe`. Quelle: [W3C Screen Wake Lock](https://www.w3.org/TR/screen-wake-lock/)
- `navigator.audioSession.type` lässt sich nur setzen, wenn dem Dokument die Berechtigung `microphone` zusteht. Quelle: [WebKit-Quelltext DOMAudioSession.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp)
- WebKit prüft die Nutzeraktivierung am Fenster des Dokuments, das den AudioContext besitzt. Quelle: [WebKit-Quelltext AudioContext.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)

**Schlussfolgerung / Empfehlung**

- Jeden Speicherzugriff in `try/catch` kapseln und ohne Speicher weiterspielen können.
- Der erste Tipp muss innerhalb der eingebetteten Seite landen, sonst startet der Klang nicht.
- Wake Lock, Manifest und Service Worker als Zugabe behandeln, die nur in der Pages-Variante greift.
- Zoom und Scrollen der einbettenden Seite lassen sich von innen nicht vollständig steuern.

---

## 7. Was nicht belegt werden konnte

1. Ob `user-scalable=no` oder `maximum-scale=1` in Home-Bildschirm-Apps beachtet wird. Belegt ist nur, dass Safari es ignoriert.
2. Ob es in Home-Bildschirm-Apps überhaupt ein Herunterziehen zum Neuladen gibt und ob `touch-action: none` es in Safari-Tabs sicher verhindert. Das Zweite ist nur aus der Spezifikation abgeleitet.
3. Ob der Stummmodus des iPad (Kontrollzentrum) Web Audio im Typ `ambient` genauso stummschaltet wie der Schalter am iPhone. Abgeleitet aus Apples Beschreibung der Kategorie.
4. Wie zuverlässig der AudioContext unter iPadOS 27.2 nach einem App-Wechsel von selbst weiterläuft. Mehrere Fehlerberichte sind offen, eine Aussage zur Behebung fehlt.
5. Welche Berührungsereignisse WebKit auf iOS genau als Nutzergeste wertet. Der zuständige iOS-Quelltext ist nicht öffentlich. Ich stütze mich auf die HTML-Spezifikation.
6. Was die Korrektur zur transienten Nutzeraktivierung in Safari 16.4 genau geändert hat. Die Notiz ist mehrdeutig.
7. Ob iPadOS das Manifest-Feld `orientation` anwendet. WebKit liest es ein, MDN meldet „nicht unterstützt", Apple schweigt.
8. Welche Wirkung `theme_color` und `theme-color` in Home-Bildschirm-Apps unter iPadOS 26 und 27 haben.
9. Welche `display-mode`-Abfrage in der installierten App zutrifft.
10. Wie sich die Statusleiste in Home-Bildschirm-Apps unter iPadOS 27.2 auf dem iPad verhält. Der Fehlerbericht ist wieder offen, die Berichte stammen überwiegend vom iPhone.
11. Ob Home-Bildschirm-Apps unter iPadOS 26 und 27 als frei skalierbare Fenster laufen und ob Fensterknöpfe dann Inhalte verdecken. Dazu fand ich nur Beiträge Dritter und keine Aussage von Apple oder WebKit.
12. Eine konkrete Speichergrenze pro Web-Prozess auf dem iPad.
13. Ob die 60-Hz-Einstellung in Home-Bildschirm-Apps immer gilt. Ein WebKit-Entwickler und ein Nutzer berichten Unterschiedliches.
14. Ob ein iPad ohne Zubehör beim Schalter-Element irgendeine haptische Rückmeldung gibt.
15. Wie die Permissions Policy für `microphone` in einem Sandbox-`iframe` mit undurchsichtiger Herkunft ausgewertet wird und ob das Setzen des Audio-Typs dort greift.
16. Ob WebKit das Meta-Tag `mobile-web-app-capable` (ohne `apple-`) auswertet.
17. Wie man mit Vite eine einzelne HTML-Datei baut. Das war nicht Teil der Fragen, und die Vite-Doku, soweit gelesen, beschreibt es nicht.
18. Ob der WebKit-Quelltext auf `main` in jedem genannten Punkt dem ausgelieferten Safari 27.2 entspricht. Geprüft ist das nur für die Canvas-Grenze.

---

## Quellenliste

### Spezifikationen

- Web Audio API 1.1, Editor's Draft vom 06.11.2026: https://webaudio.github.io/web-audio-api/
- HTML Living Standard, User Activation: https://html.spec.whatwg.org/multipage/interaction.html#tracking-user-activation
- HTML Living Standard, Web Storage: https://html.spec.whatwg.org/multipage/webstorage.html
- W3C Audio Session, Editor's Draft vom 13.11.2024: https://w3c.github.io/audio-session/
- W3C Pointer Events Level 3, Empfehlung vom 30.06.2026: https://www.w3.org/TR/pointerevents3/
- W3C Screen Wake Lock API, Arbeitsentwurf vom 11.11.2026: https://www.w3.org/TR/screen-wake-lock/
- W3C Web Application Manifest, Arbeitsentwurf vom 11.11.2026: https://www.w3.org/TR/appmanifest/

### WebKit-Blog und WebKit-Seiten

- WebKit Features for Safari 27.0: https://webkit.org/blog/18325/webkit-features-for-safari-27-0/
- WebKit Features for Safari 27.1: https://webkit.org/blog/18486/webkit-features-for-safari-27-1/
- WebKit Features for Safari 27.2: https://webkit.org/blog/18515/webkit-features-for-safari-27-2/
- WebKit Features in Safari 26.0: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
- WebKit Features in Safari 18.0: https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
- WebKit Features in Safari 16.4: https://webkit.org/blog/13966/webkit-features-in-safari-16-4/
- Web Push for Web Apps on iOS and iPadOS: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
- Updates to Storage Policy: https://webkit.org/blog/14403/updates-to-storage-policy/
- Full Third-Party Cookie Blocking and More: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- Tracking Prevention in WebKit: https://webkit.org/tracking-prevention/
- Workers at Your Service: https://webkit.org/blog/8090/workers-at-your-service/
- Designing Websites for iPhone X: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
- More Responsive Tapping on iOS: https://webkit.org/blog/5610/more-responsive-tapping-on-ios/
- Explainer Animation frame rate: https://webkit.github.io/explainers/animation-frame-rate
- WebKit standards-positions #267, Vibration API: https://github.com/WebKit/standards-positions/issues/267

### WebKit-Quelltext (Zweig main, 14.11.2026, sofern nicht anders genannt)

- AudioContext.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp
- DOMAudioSession.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.cpp
- DOMAudioSession.idl: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/audiosession/DOMAudioSession.idl
- MediaSessionManagerCocoa.mm: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/cocoa/MediaSessionManagerCocoa.mm
- AudioSessionIOS.mm: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/audio/ios/AudioSessionIOS.mm
- UnifiedWebPreferences.yaml: https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml
- AnimationFrameRate.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/AnimationFrameRate.cpp
- CanvasBase.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CanvasBase.cpp
- CanvasBase.cpp, Tag WebKit-7618.2.11 (Linie Safari 17.5): https://github.com/WebKit/WebKit/blob/WebKit-7618.2.11/Source/WebCore/html/CanvasBase.cpp
- CanvasBase.cpp, Tag WebKit-7619.1.24 (Linie Safari 18.0): https://github.com/WebKit/WebKit/blob/WebKit-7619.1.24/Source/WebCore/html/CanvasBase.cpp
- Änderung 276145@main, Canvas-Grenze auf iOS: https://commits.webkit.org/276145@main
- Änderung 265628@main, Canvas-Speichergrenze entfernt: https://commits.webkit.org/265628@main
- CheckboxInputType.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CheckboxInputType.cpp
- PageClientImplIOS.mm: https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/PageClientImplIOS.mm
- ApplicationManifestParser.cpp: https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/applicationmanifest/ApplicationManifestParser.cpp

### WebKit-Bugzilla

- 237322, Web Audio bei Stummschaltung stumm: https://bugs.webkit.org/show_bug.cgi?id=237322
- 281955, AudioContext setzt im Vordergrund nicht fort: https://bugs.webkit.org/show_bug.cgi?id=281955
- 263627, AudioContext nicht verlässlich fortgesetzt: https://bugs.webkit.org/show_bug.cgi?id=263627
- 291892, Web Audio stumm nach Rückkehr in Home-Bildschirm-App: https://bugs.webkit.org/show_bug.cgi?id=291892
- 254545, Wake Lock in Home-Bildschirm-Apps: https://bugs.webkit.org/show_bug.cgi?id=254545
- 301994, Statusleiste bleibt in Home-Bildschirm-Apps sichtbar: https://bugs.webkit.org/show_bug.cgi?id=301994
- 316008, falsche Höhenwerte ohne Statusleisten-Stil: https://bugs.webkit.org/show_bug.cgi?id=316008
- 254868, falsche Höhenwerte mit viewport-fit=cover: https://bugs.webkit.org/show_bug.cgi?id=254868
- 306465, viewport-fit=cover im Hochformat: https://bugs.webkit.org/show_bug.cgi?id=306465
- 260508, Statusleisten-Stil ändert sich nicht nachträglich: https://bugs.webkit.org/show_bug.cgi?id=260508
- 264218, display-mode in der installierten App: https://bugs.webkit.org/show_bug.cgi?id=264218
- 301756, Tönung der Leiste und theme-color: https://bugs.webkit.org/show_bug.cgi?id=301756
- 243452, overscroll-behavior ohne Überlauf: https://bugs.webkit.org/show_bug.cgi?id=243452
- 275947, overscroll-behavior und Neuladen durch Herunterziehen: https://bugs.webkit.org/show_bug.cgi?id=275947
- 173434, 120 Hz für requestAnimationFrame: https://bugs.webkit.org/show_bug.cgi?id=173434
- 294338, 120 Hz in WKWebView und Web-Apps: https://bugs.webkit.org/show_bug.cgi?id=294338
- 271002, Canvas-Grenze auf iOS: https://bugs.webkit.org/show_bug.cgi?id=271002
- 195325, Canvas-Speichergrenze: https://bugs.webkit.org/show_bug.cgi?id=195325

### Apple

- Safari Release Notes, Übersicht: https://developer.apple.com/documentation/safari-release-notes
- Safari 27.3 Beta: https://developer.apple.com/documentation/safari-release-notes/safari-27_3-release-notes
- Safari 27: https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes
- Safari 26.2: https://developer.apple.com/documentation/safari-release-notes/safari-26_2-release-notes
- Safari 26.0: https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes
- Safari 18.4: https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes
- Safari 18.3: https://developer.apple.com/documentation/safari-release-notes/safari-18_3-release-notes
- Safari 18.2: https://developer.apple.com/documentation/safari-release-notes/safari-18_2-release-notes
- Safari 18: https://developer.apple.com/documentation/safari-release-notes/safari-18-release-notes
- Safari 17.4: https://developer.apple.com/documentation/safari-release-notes/safari-17_4-release-notes
- Safari 17.2: https://developer.apple.com/documentation/safari-release-notes/safari-17_2-release-notes
- Safari 17: https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes
- Safari 16.4: https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes
- Safari 16: https://developer.apple.com/documentation/safari-release-notes/safari-16-release-notes
- Safari 15.4: https://developer.apple.com/documentation/safari-release-notes/safari-15_4-release-notes
- Safari 13: https://developer.apple.com/documentation/safari-release-notes/safari-13-release-notes
- Safari 12.1: https://developer.apple.com/documentation/safari-release-notes/safari-12_1-release-notes
- Safari 11.1 (Archiv): https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_11_1.html
- Safari 10 (Archiv): https://developer.apple.com/library/archive/releasenotes/General/WhatsNewInSafari/Articles/Safari_10_0.html
- Supported Meta Tags (Archiv, 2014): https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html
- Configuring Web Applications (Archiv, 2016): https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- AVAudioSession.Category.ambient: https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient
- AVAudioSession.Category.playback: https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playback
- AVAudioSession.Category.soloAmbient: https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/soloambient
- Human Interface Guidelines, Playing haptics: https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- iPad-Benutzerhandbuch, Lautstärke anpassen und stummschalten: https://support.apple.com/guide/ipad/adjust-the-volume-and-silence-ipad9940e758/ipados

### MDN und web.dev

- BaseAudioContext.state: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state
- Web Audio API best practices: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices
- Audio Session API: https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API
- AudioSession.type: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
- Screen Wake Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- addEventListener: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
- iframe: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- -webkit-touch-callout: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-touch-callout
- Kompatibilitätsdaten (browser-compat-data): https://github.com/mdn/browser-compat-data
- web.dev, Learn PWA, Web app manifest: https://web.dev/learn/pwa/web-app-manifest
- web.dev, Learn PWA, App design: https://web.dev/learn/pwa/app-design
- web.dev, Learn PWA, Installation: https://web.dev/learn/pwa/installation

### Vite und GitHub

- Vite, Deploying a Static Site: https://vite.dev/guide/static-deploy#github-pages
- Vite, Building for Production: https://vite.dev/guide/build
- Vite, Beispiel-Workflow: https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml
- GitHub Docs, Using custom workflows with GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- GitHub Docs, Configuring a publishing source: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- GitHub Docs, Creating a GitHub Pages site: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Docs, GitHub Pages limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- GitHub Docs, GitHub's plans: https://docs.github.com/en/get-started/learning-about-github/githubs-plans
- GitHub Docs, Securing your GitHub Pages site with HTTPS: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- GitHub Docs, Changing the visibility of your GitHub Pages site: https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site
- actions/checkout, Releases: https://github.com/actions/checkout/releases
- actions/setup-node, Releases: https://github.com/actions/setup-node/releases
- actions/configure-pages, Releases: https://github.com/actions/configure-pages/releases
- actions/upload-pages-artifact, Releases: https://github.com/actions/upload-pages-artifact/releases
- actions/deploy-pages, Releases: https://github.com/actions/deploy-pages/releases
