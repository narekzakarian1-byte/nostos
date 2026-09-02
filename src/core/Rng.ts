// Единственный источник случайности в проекте. Math.random() запрещён:
// без воспроизводимого прогона по сиду баланс невозможно проверять.
export class Rng {
  private state: number;

  constructor(seed: number) {
    // >>> 0 приводит к uint32: mulberry32 работает только на беззнаковом состоянии.
    this.state = seed >>> 0;
  }

  /** Следующее число в [0, 1). Алгоритм mulberry32. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Дробное число в [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Целое в [min, max] включительно. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** true с вероятностью p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /**
   * Дочерний поток случайности: один отбор из родителя. Нужен косметике —
   * искры и вылеты не должны сдвигать боевые броски крита и дропа, иначе
   * прогон по сиду перестаёт совпадать сам с собой при любой правке юса.
   */
  fork(): Rng {
    return new Rng(this.next() * 4294967296);
  }

  /** Знак: -1 или +1. Нужен для направления тряски камеры и разброса цифр урона. */
  sign(): number {
    return this.next() < 0.5 ? -1 : 1;
  }
}
