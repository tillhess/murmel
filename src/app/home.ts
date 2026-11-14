import { PAPER } from '../art/materials';
import { t } from './i18n';
import type { Picture } from './library';
import { store } from './storage';

/** Zeichnet die Vorschau eines Bildes: blass, wenn es neu ist; teils farbig, wenn begonnen; ganz, wenn fertig. */
function drawPreview(canvas: HTMLCanvasElement, picture: Picture): 'neu' | 'begonnen' | 'fertig' {
  const px = 480;
  canvas.width = canvas.height = px;
  const x = canvas.getContext('2d') as CanvasRenderingContext2D;
  x.imageSmoothingQuality = 'high';
  if (store.isFinished(picture.key)) {
    x.drawImage(picture.thumb, 0, 0, px, px);
    return 'fertig';
  }
  x.fillStyle = PAPER;
  x.fillRect(0, 0, px, px);
  x.globalAlpha = 0.36;
  x.drawImage(picture.thumb, 0, 0, px, px);
  x.globalAlpha = 1;
  const saved = store.progress(picture.key);
  if (!saved) return 'neu';
  // was schon liegt, in voller Farbe
  const { w, h, target } = picture.level;
  const sw = picture.thumb.width / w;
  const sh = picture.thumb.height / h;
  const cw = px / w;
  const ch = px / h;
  let any = false;
  for (let i = 0; i < target.length; i++) {
    if (target[i] < 0 || saved.cur[i] !== target[i]) continue;
    any = true;
    const cx = i % w;
    const cy = Math.floor(i / w);
    x.drawImage(picture.thumb, cx * sw, cy * sh, sw, sh, cx * cw, cy * ch, cw + 0.5, ch + 0.5);
  }
  return any ? 'begonnen' : 'neu';
}

const TILTS = [-1.6, 1.1, -0.7, 1.5, -1.2, 0.8];

export interface HomeHandlers {
  open(picture: Picture): void;
  choosePhoto(): void;
  /** nimmt ein eigenes Bild aus der Sammlung */
  remove(picture: Picture): void;
}

/** Baut die Sammlung auf der Startseite neu auf. Sie bleibt dabei an der Stelle stehen, bis zu der gescrollt war. */
export function renderShelf(shelf: HTMLElement, list: Picture[], handlers: HomeHandlers): void {
  const at = { left: shelf.scrollLeft, top: shelf.scrollTop };
  shelf.replaceChildren();
  list.forEach((picture, k) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'print';
    card.dataset.id = picture.id;
    card.style.setProperty('--tilt', `${TILTS[k % TILTS.length]}deg`);
    const canvas = document.createElement('canvas');
    const state = drawPreview(canvas, picture);
    const name = document.createElement('span');
    name.className = 'print-name';
    name.textContent = picture.name;
    const label = document.createElement('span');
    label.className = 'print-state';
    const size = `${picture.level.w} × ${picture.level.h}`;
    label.textContent =
      state === 'neu' ? size : `${t(state === 'fertig' ? 'state_finished' : 'state_started')} · ${size}`;
    card.append(canvas, name, label);
    card.addEventListener('click', () => handlers.open(picture));
    if (!picture.own) {
      shelf.append(card);
      return;
    }
    // Ein eigenes Bild lässt sich wieder entfernen. Der erste Tipp fragt nach, erst der zweite entfernt.
    const wrap = document.createElement('div');
    wrap.className = 'print-wrap';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'print-remove';
    remove.setAttribute('aria-label', t('remove_label', { name: picture.name }));
    remove.textContent = '×';
    let asked = 0;
    remove.addEventListener('click', () => {
      if (!remove.classList.contains('asking')) {
        remove.classList.add('asking');
        remove.textContent = t('remove_ask');
        asked = window.setTimeout(() => {
          remove.classList.remove('asking');
          remove.textContent = '×';
        }, 3200);
        return;
      }
      clearTimeout(asked);
      handlers.remove(picture);
    });
    wrap.append(card, remove);
    shelf.append(wrap);
  });

  // leeres Blatt: ein eigenes Foto
  const own = document.createElement('button');
  own.type = 'button';
  own.className = 'print own';
  own.style.setProperty('--tilt', `${TILTS[list.length % TILTS.length]}deg`);
  const blank = document.createElement('canvas');
  blank.width = blank.height = 480;
  const x = blank.getContext('2d') as CanvasRenderingContext2D;
  x.fillStyle = PAPER;
  x.fillRect(0, 0, 480, 480);
  x.strokeStyle = 'rgba(43,39,51,0.45)';
  x.lineWidth = 3;
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(240, 196);
  x.lineTo(240, 284);
  x.moveTo(196, 240);
  x.lineTo(284, 240);
  x.stroke();
  const name = document.createElement('span');
  name.className = 'print-name';
  name.textContent = t(list.some((p) => p.own) ? 'own_more' : 'own_first');
  const label = document.createElement('span');
  label.className = 'print-state';
  label.textContent = t('own_choose');
  own.append(blank, name, label);
  own.addEventListener('click', () => handlers.choosePhoto());
  shelf.append(own);
  shelf.scrollTo(at.left, at.top);
}
