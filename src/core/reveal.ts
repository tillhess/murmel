/** Bildfarbe erwacht erst nach der letzten Ankunft einer Kette, dann eine Sekunde lang. */
export const REVEAL_MS = 1000;

export function revealProgress(start: number | null, now: number): number {
  if (start === null) return 0;
  const p = Math.max(0, Math.min(1, (now - start) / REVEAL_MS));
  // Flache Enden vermeiden sowohl den ersten Farbsprung als auch ein abruptes Ende.
  return p * p * (3 - 2 * p);
}
