import { getBalance } from '../core/Balance.ts';
import type { EnemyTier, IslandDef } from '../core/BalanceTypes.ts';
import * as f from '../core/formulas/enemy.ts';

// Тонкий слой над formulas/enemy.ts: числа из конфига, счёт — там.

/** Кривая силы острова по BALANCE.md §6: powerBase^(n-1). */
export function islandPower(n: number): number {
  return f.islandPower(getBalance().islands.powerBase, n);
}

export function enemyMaxHp(n: number, tier: EnemyTier): number {
  const { islands, enemyTiers } = getBalance();
  return f.enemyHp(islands.baseHp, islandPower(n), enemyTiers[tier].hpMult);
}

export function enemyDps(n: number, tier: EnemyTier): number {
  const { islands, enemyTiers } = getBalance();
  return f.enemyDps(islands.baseDps, islandPower(n), enemyTiers[tier].dpsMult);
}

/** Базовая защита врага до применения профиля weakness/neutral/resist. */
export function enemyBaseDef(n: number, tier: EnemyTier): number {
  const { enemyDefense, enemyTiers } = getBalance();
  return f.enemyBaseDef(enemyDefense.baseDef, islandPower(n), enemyTiers[tier].defMult);
}

/**
 * id острова, на котором идёт игра прямо сейчас. Им выбирается арт
 * (ui/IslandArt.ts) и набор декора (world/Scenery.ts). Пока остров один и
 * задан в prototype.islandNumber — когда появится переход между островами,
 * менять придётся только здесь.
 */
export function currentIslandId(): string {
  return islandDef(getBalance().prototype.islandNumber).id;
}

export function islandDef(n: number): IslandDef {
  const island = getBalance().islands.list.find((entry) => entry.n === n);
  if (!island) throw new Error(`NOSTOS: острова ${n} нет в balance.json`);
  return island;
}
