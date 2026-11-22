import type { Pt } from './chain';

export interface PictureFrame {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly rim: number;
}

const clamp = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Ein Ablageweg bleibt am Boden. Nur über der Holzleiste hebt die Murmel kurz ab.
 * Alle Maße sind Bildschirmmaße: Der Rahmen bleibt auch beim Vergrößern an derselben Stelle.
 */
export function transferPose(
  board: Pt,
  tray: Pt,
  progress: number,
  frame: PictureFrame,
  boardSize: number,
  traySize: number,
): { x: number; y: number; size: number; height: number } {
  const p = clamp(progress);
  const dx = tray[0] - board[0];
  const dy = tray[1] - board[1];
  const length = Math.hypot(dx, dy);
  const edge = (inset: number): number => {
    const tx =
      dx > 0 ? (frame.x + frame.w - inset - board[0]) / dx : dx < 0 ? (frame.x + inset - board[0]) / dx : Infinity;
    const ty =
      dy > 0 ? (frame.y + frame.h - inset - board[1]) / dy : dy < 0 ? (frame.y + inset - board[1]) / dy : Infinity;
    return clamp(Math.min(tx, ty));
  };
  const outer = edge(0);
  const inner = edge(frame.rim);
  const radius = boardSize / 2;
  const takeoff = Math.max(0, inner - (radius * 0.55) / Math.max(1, length));
  const landing = Math.min(1, outer + (radius * 0.85) / Math.max(1, length));
  const hop = landing > takeoff ? clamp((p - takeoff) / (landing - takeoff)) : 0;
  const height = length > 0 ? 4 * hop * (1 - hop) * Math.max(frame.rim * 1.2, Math.min(20, radius)) : 0;
  // Erst außerhalb des Rahmens passt sich die Murmel an die Größe der Mulden an.
  const growth = outer < 1 ? clamp((p - outer) / (1 - outer)) : 0;
  const eased = growth * growth * (3 - 2 * growth);
  return {
    x: board[0] + dx * p,
    y: board[1] + dy * p,
    size: boardSize + (traySize - boardSize) * eased,
    height,
  };
}
