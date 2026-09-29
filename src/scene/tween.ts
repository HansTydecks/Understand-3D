/** Exponentielles Annähern, unabhängig von der Bildrate. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Wie damp, aber über den kürzesten Winkelweg. */
export function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * (1 - Math.exp(-lambda * dt));
}

/** Feder mit leichtem Nachschwingen – freundliche, „lebendige“ Größenänderungen. */
export class Spring {
  x: number;
  v = 0;
  constructor(x: number) {
    this.x = x;
  }
  step(target: number, dt: number, stiffness = 180, damping = 15): number {
    // Kleine Teilschritte halten die Feder auch bei hoher Steifigkeit (Zeitraffer) stabil.
    const total = Math.min(dt, 1 / 30);
    const steps = Math.max(1, Math.ceil(total * Math.sqrt(stiffness) * 4));
    const h = total / steps;
    for (let i = 0; i < steps; i++) {
      const a = stiffness * (target - this.x) - damping * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    if (Math.abs(target - this.x) < 1e-4 && Math.abs(this.v) < 1e-4) {
      this.x = target;
      this.v = 0;
    }
    return this.x;
  }
}

export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
