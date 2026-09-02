import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

/** Тряска камеры. Амплитуда больше на крите — удар должен ощущаться сильнее. */
export class Screenshake {
  private readonly rng: Rng;
  private amplitude = 0;
  private offsetX = 0;
  private offsetY = 0;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  hit(crit: boolean): void {
    const { screenshakeBase, screenshakeCrit } = getBalance().juice;
    const next = crit ? screenshakeCrit : screenshakeBase;
    this.amplitude = Math.max(this.amplitude, next);
  }

  tick(dt: number): void {
    const { screenshakeDecayMs } = getBalance().juice;
    if (this.amplitude <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }
    const decayPerSecond = getBalance().juice.screenshakeCrit / (screenshakeDecayMs / 1000);
    this.amplitude = Math.max(0, this.amplitude - decayPerSecond * dt);
    this.offsetX = this.rng.sign() * this.rng.next() * this.amplitude;
    this.offsetY = this.rng.sign() * this.rng.next() * this.amplitude;
  }

  get x(): number {
    return this.offsetX;
  }

  get y(): number {
    return this.offsetY;
  }
}
