/**
 * Animationstempo. `?fast` in der Adresse beschleunigt alles (für automatische Tests),
 * „Ruhige Animationen“ verkürzt Wege und nimmt Nachschwingen heraus.
 */
const params =
  typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
export const FAST = params.has("fast");

export const speedFactor = (calm: boolean): number => (FAST ? 10 : calm ? 2 : 1);
