import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

interface DamageNumber {
  value: number;
  x: number;
  y: number;
  drift: number;
  crit: boolean;
  age: number;
}

/** Вылетающие цифры урона. Крит крупнее и другим цветом — иначе он не читается. */
export class DamageNumbers {
  private readonly items: DamageNumber[] = [];
  private readonly rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  spawn(value: number, x: number, y: number, crit: boolean): void {
    this.items.push({ value, x, y, drift: this.rng.sign() * this.rng.next(), crit, age: 0 });
  }

  tick(dt: number): void {
    const lifeSeconds = getBalance().juice.damageNumberLifeMs / 1000;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i]!;
      item.age += dt;
      if (item.age >= lifeSeconds) this.items.splice(i, 1);
    }
  }

  /** Доля прожитой жизни в [0, 1] — рендер сам решает, как её показать. */
  forEach(fn: (item: Readonly<DamageNumber>, progress: number) => void): void {
    const lifeSeconds = getBalance().juice.damageNumberLifeMs / 1000;
    for (const item of this.items) fn(item, Math.min(1, item.age / lifeSeconds));
  }
}
