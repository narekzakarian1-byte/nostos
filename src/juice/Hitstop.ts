import { getBalance } from '../core/Balance.ts';

/**
 * Короткая остановка логики на попадании. Рендер продолжается — застывает
 * именно мир, и удар получает вес.
 */
export class Hitstop {
  private readonly freeze: (ms: number) => void;

  constructor(freeze: (ms: number) => void) {
    this.freeze = freeze;
  }

  hit(crit: boolean): void {
    const { hitstopMs, hitstopCritMs } = getBalance().juice;
    this.freeze(crit ? hitstopCritMs : hitstopMs);
  }
}
