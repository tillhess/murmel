import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { HOLE_STYLES } from '../art/holes';
import { MARBLE_STYLES } from '../art/marble';
import { SCENES } from '../art/scenes';
import { LANGUAGES, language, onLanguage, pickLanguage, sceneName, setLanguage, TEXTS, t } from './i18n';
import { de } from './texts/de';

const keys = Object.keys(de) as (keyof typeof de)[];
const placeholders = (text: string): string[] => (text.match(/\{\w+\}/g) ?? []).sort();

afterEach(() => setLanguage('de'));

describe('Sprache des Geräts', () => {
  it('nimmt die erste Sprache, die das Spiel spricht', () => {
    expect(pickLanguage(['fr-FR', 'en'])).toBe('fr');
    expect(pickLanguage(['nl-NL', 'es-MX', 'de'])).toBe('es');
    expect(pickLanguage(['de'])).toBe('de');
  });

  it('achtet nur auf die Sprache, nicht auf Land oder Schreibweise', () => {
    expect(pickLanguage(['IT-ch'])).toBe('it');
    expect(pickLanguage(['de_AT'])).toBe('de');
    expect(pickLanguage(['en-GB'])).toBe('en');
  });

  it('fällt auf Englisch zurück, wenn keine passt', () => {
    expect(pickLanguage(['ja-JP', 'nl'])).toBe('en');
    expect(pickLanguage([])).toBe('en');
    expect(pickLanguage([''])).toBe('en');
  });
});

describe('Sprache wählen', () => {
  it('gilt sofort und meldet den Wechsel', () => {
    let told = 0;
    onLanguage(() => told++);
    setLanguage('it');
    expect(language()).toBe('it');
    expect(t('hint_start')).toBe('Tocca una biglia.');
    expect(told).toBe(1);
    // dieselbe Sprache noch einmal ist kein Wechsel
    setLanguage('it');
    expect(told).toBe(1);
  });

  it('folgt ohne eigene Wahl dem Gerät', () => {
    setLanguage(null, ['es-ES', 'en']);
    expect(language()).toBe('es');
    setLanguage(null, ['ko']);
    expect(language()).toBe('en');
  });

  it('setzt Platzhalter ein', () => {
    setLanguage('en');
    expect(t('own_name_n', { n: 3 })).toBe('Your picture 3');
    expect(t('remove_label', { name: 'Koi' })).toBe('Remove Koi');
  });
});

describe.each(LANGUAGES)('Wörterbuch %s', (lang) => {
  const texts = TEXTS[lang];

  it('hat für jeden Schlüssel einen Text', () => {
    for (const key of keys) expect(texts[key]?.trim(), key).toBeTruthy();
  });

  it('hat dieselben Platzhalter wie die Ausgangssprache', () => {
    for (const key of keys) expect(placeholders(texts[key]), key).toEqual(placeholders(de[key]));
  });

  it('bleibt ruhig: kein Ausrufezeichen', () => {
    for (const key of keys) expect(texts[key], key).not.toMatch(/[!¡]/);
  });

  it('nennt das Spiel überall „Murmel“', () => {
    for (const key of ['install_ios', 'install_mac'] as const) expect(texts[key]).toContain('Murmel');
  });

  it('kennt jedes Motiv, jeden Entwurf und jede Murmelart', () => {
    for (const scene of SCENES) expect(texts, scene.id).toHaveProperty(`scene_${scene.id}`);
    for (const style of HOLE_STYLES) expect(texts).toHaveProperty(`hole_${style}`);
    for (const style of MARBLE_STYLES) expect(texts).toHaveProperty(`marble_${style}`);
  });
});

describe('Motive', () => {
  it('heißen auf Deutsch so wie in ihrer Beschreibung', () => {
    for (const scene of SCENES) expect(sceneName(scene.id, '')).toBe(scene.name);
  });

  it('behalten ihren Arbeitsnamen, solange sie in keinem Wörterbuch stehen', () => {
    expect(sceneName('gibt-es-nicht', 'Arbeitsname')).toBe('Arbeitsname');
  });
});

describe('Die Seite', () => {
  const html = readFileSync('index.html', 'utf8');

  it('verweist nur auf Schlüssel, die es gibt', () => {
    const used = [...html.matchAll(/data-t(?:-label|-content)?="([^"]+)"/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(20);
    for (const key of used) expect(de, key).toHaveProperty(key);
  });
});
