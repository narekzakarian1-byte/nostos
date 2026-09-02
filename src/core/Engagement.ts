import { getBalance } from './Balance.ts';
import { incomingDps, type GearLike } from './Combat.ts';
import type { DamageType } from './BalanceTypes.ts';
import type { Stats } from './Stats.ts';
import type { Enemy } from '../world/Enemy.ts';

/**
 * Кто сейчас в бою с игроком.
 *
 * Цели асимметричны намеренно: бьют все, кто в радиусе, а отвечает игрок только
 * ближайшему. Толпа — чистая угроза, поэтому «где встать» становится решением
 * наравне с «дожать или отойти».
 */
export class Engagement {
  private readonly engaged = new Set<Enemy>();

  get count(): number {
    return this.engaged.size;
  }

  /** Все, кто бьёт игрока прямо сейчас. */
  attackers(): Iterable<Enemy> {
    return this.engaged;
  }

  has(enemy: Enemy): boolean {
    return this.engaged.has(enemy);
  }

  clear(): void {
    this.engaged.clear();
  }

  drop(enemy: Enemy): void {
    this.engaged.delete(enemy);
  }

  /**
   * Гистерезис: сцепка на engageRange, расцепка только на disengageRange.
   * Без зазора бой мигал бы на границе дистанции.
   */
  update(enemies: readonly Enemy[], x: number, y: number): void {
    const { engageRange, disengageRange } = getBalance().combat;
    for (const enemy of enemies) {
      if (!enemy.alive) {
        this.engaged.delete(enemy);
        continue;
      }
      const distance = Math.hypot(x - enemy.x, y - enemy.y);
      if (this.engaged.has(enemy)) {
        if (distance > disengageRange) this.engaged.delete(enemy);
      } else if (distance <= engageRange) {
        this.engaged.add(enemy);
      }
    }
  }

  /** Ближайший сцепленный враг — единственная цель ответного огня. */
  nearest(x: number, y: number): Enemy | null {
    let best: Enemy | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of this.engaged) {
      const distance = Math.hypot(x - enemy.x, y - enemy.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = enemy;
      }
    }
    return best;
  }

  /** Суммарный входящий DPS от всех сцепленных — для дев-панели. */
  incomingDps(stats: Stats, armor: Record<DamageType, GearLike>): number {
    let total = 0;
    for (const enemy of this.engaged) {
      total += incomingDps(enemy.dps, enemy.weakness, stats, armor);
    }
    return total;
  }
}
