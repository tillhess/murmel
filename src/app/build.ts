import { t } from './i18n';

/** Deutsche Ortszeit gilt unabhängig von Uhr und Zeitzone des Geräts, einschließlich Sommerzeit. */
export function buildLabel(): string {
  const date = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(__BUILD_INFO__.builtAt));
  return t(__BUILD_INFO__.preview ? 'build_preview' : 'build_release', { version: __BUILD_INFO__.version, date });
}
