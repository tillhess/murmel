import { de, type TextKey, type Texts } from './texts/de';
import { en } from './texts/en';
import { es } from './texts/es';
import { fr } from './texts/fr';
import { it } from './texts/it';

/**
 * Die Sprachen des Spiels. Englisch steht vorn: Es gilt, wenn keine Sprache des Geräts dabei ist.
 * Jede Sprache hat ein vollständiges Wörterbuch in `texts/`; fehlt dort ein Schlüssel, scheitert die Typprüfung.
 */
export const LANGUAGES = ['en', 'de', 'it', 'fr', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];
export type { TextKey };

/** Jede Sprache heißt in der Auswahl so, wie sie sich selbst nennt: Wer sich verirrt hat, findet zurück. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  fr: 'Français',
  es: 'Español',
};

export const TEXTS: Record<Language, Texts> = { en, de, it, fr, es };

/**
 * Die erste Sprache aus den Wünschen des Geräts (wie `navigator.languages`), die das Spiel spricht.
 * Es zählt nur die Sprache, nicht das Land: „fr-CA“ ist Französisch.
 */
export function pickLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    const known = LANGUAGES.find((language) => language === base);
    if (known) return known;
  }
  return LANGUAGES[0];
}

function deviceLanguages(): readonly string[] {
  if (typeof navigator === 'undefined') return [];
  return navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
}

/** Bis das Spiel beim Start die Sprache festlegt, gilt die Ausgangssprache (auch für die Musterblätter in `dev/`). */
let current: Language = 'de';
const listeners: (() => void)[] = [];

export const language = (): Language => current;

/**
 * Legt die Sprache fest: eine der fünf, oder null für die Sprache des Geräts.
 * Wer sich mit `onLanguage` angemeldet hat, erfährt von einem Wechsel und schreibt seine Texte neu.
 */
export function setLanguage(choice: Language | null, preferred: readonly string[] = deviceLanguages()): void {
  const next = choice ?? pickLanguage(preferred);
  if (next === current) return;
  current = next;
  for (const listener of listeners) listener();
}

export function onLanguage(listener: () => void): void {
  listeners.push(listener);
}

/** Der Text zu einem Schlüssel in der geltenden Sprache; `{name}` wird durch `values.name` ersetzt. */
export function t(key: TextKey, values?: Record<string, string | number>): string {
  const text = TEXTS[current][key];
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** Der Name eines Motivs. Ein Motiv, das noch in keinem Wörterbuch steht, behält seinen Arbeitsnamen. */
export function sceneName(id: string, fallback: string): string {
  const key = `scene_${id}`;
  return key in de ? t(key as TextKey) : fallback;
}

/**
 * Schreibt die festen Texte der Seite in der geltenden Sprache: `data-t` nennt den Schlüssel für den Inhalt,
 * `data-t-label` den für `aria-label`, `data-t-content` den für `content` (Meta-Angaben).
 */
export function applyTexts(root: Document): void {
  root.documentElement.lang = current;
  // bis hierher hält das Stylesheet die deutschen Texte der Seite unsichtbar, damit keine falsche Sprache aufblitzt
  root.documentElement.dataset.texts = 'ready';
  const each = (attribute: string, write: (el: HTMLElement, text: string) => void): void => {
    for (const el of root.querySelectorAll<HTMLElement>(`[${attribute}]`)) {
      const key = el.getAttribute(attribute) ?? '';
      if (key in de) write(el, t(key as TextKey));
    }
  };
  each('data-t', (el, text) => {
    el.textContent = text;
  });
  each('data-t-label', (el, text) => el.setAttribute('aria-label', text));
  each('data-t-content', (el, text) => el.setAttribute('content', text));
}
