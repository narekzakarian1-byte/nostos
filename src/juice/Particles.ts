import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  color: string;
  size: number;
}

/**
 * Искры в точке контакта. Цвет приходит снаружи — тот же, что у иконки типа,
 * которым игрок сейчас пробивает врага: всплеск подтверждает решение, а не
 * просто украшает удар.
 *
 * Свой поток случайности (Rng.fork в Game): косметика не должна сдвигать
 * боевые броски крита и дропа, иначе один и тот же сид давал бы разные прогоны
 * до и после включения искр.
 */
export class Particles {
  private readonly items: Particle[] = [];
  private readonly rng: Rng;

  constructor(rng: Rng) {
    this.rng = rng;
  }

  get count(): number {
    return this.items.length;
  }

  /** Веер искр из точки (x, y) в направлении удара. */
  burst(x: number, y: number, dirX: number, dirY: number, color: string, crit: boolean): void {
    const { anim } = getBalance();
    const count = Math.round(anim.particlesPerHit * (crit ? anim.particlesCritScale : 1));
    const base = Math.atan2(dirY, dirX);

    for (let i = 0; i < count; i++) {
      // Потолок общий, а не на всплеск: при десятке врагов вокруг иначе
      // набегает пара сотен искр, и кадр на телефоне проседает именно в бою.
      if (this.items.length >= anim.particleMax) this.items.shift();
      const angle = base + this.rng.range(-anim.particleSpread, anim.particleSpread);
      const speed = anim.particleSpeed * this.rng.range(0.4, 1);
      this.items.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        color,
        size: anim.particleSize * this.rng.range(0.6, 1),
      });
    }
  }

  tick(dt: number): void {
    const { particleLifeSec, particleGravity } = getBalance().anim;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i]!;
      p.age += dt;
      if (p.age >= particleLifeSec) {
        this.items.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += particleGravity * dt;
    }
  }

  /** Доля прожитой жизни в [0, 1] — рендер сам решает, как её показать. */
  forEach(fn: (item: Readonly<Particle>, progress: number) => void): void {
    const { particleLifeSec } = getBalance().anim;
    for (const p of this.items) fn(p, Math.min(1, p.age / particleLifeSec));
  }
}
