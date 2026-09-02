import { getBalance } from '../core/Balance.ts';
import type { EnemyArchetype, EnemyTier } from '../core/BalanceTypes.ts';
import { statGain } from '../core/formulas/growth.ts';
import type { Stats } from '../core/Stats.ts';
import { islandPower } from '../world/Island.ts';

/**
 * Прирост статов с убитого врага (BALANCE.md §8). Прилетает мгновенно, прямо
 * в бою, без экрана результатов — как в референсе.
 *
 * Затухание обязательно: без него фарм самых слабых врагов на десятом острове
 * выгоднее боя с сильными, и эксплойт находят за сутки.
 *
 * Один и тот же модуль использует и игра, и симулятор — двух источников правды
 * по росту быть не должно.
 */
export function killValue(tier: EnemyTier, islandNumber: number): number {
  return getBalance().growth.tierValue[tier] * islandPower(islandNumber);
}

/** Возвращает, сколько каждый стат прибавил — для отладки и дев-панели. */
export function applyKill(
  stats: Stats,
  tier: EnemyTier,
  archetype: EnemyArchetype,
  islandNumber: number,
): void {
  const { gainRate, diminishK, dropTable } = getBalance().growth;
  const value = killValue(tier, islandNumber);

  for (const key of dropTable[archetype]) {
    const current = stats.get(key);
    stats.set(key, current + statGain(value, gainRate, current, diminishK));
  }
}
