import type { DamageType, Rarity } from '../core/BalanceTypes.ts';
import { totalDps, type ByType } from '../core/Combat.ts';
import type { Inventory } from '../player/Inventory.ts';
import { RARITY_RU, TYPE_RU, Weapon } from '../player/Weapon.ts';
import type { Stats } from '../core/Stats.ts';

const TYPES: readonly DamageType[] = ['pierce', 'slash', 'crush'];

export interface UpgradeRow {
  readonly type: DamageType;
  readonly rarity: Rarity;
  readonly level: number;
  readonly title: string;
  readonly copies: number;
  readonly cost: number;
  readonly ready: boolean;
  readonly dpsNow: number;
  readonly dpsNext: number;
}

/**
 * Модель нижней полосы слотов и панели характеристик. Рисуют её ui/WeaponBar.ts
 * и ui/StatsScreen.ts — здесь только числа, чтобы обе панели показывали
 * одно и то же и не разъезжались.
 *
 * Прирост считается абсолютным DPS («552 → 685»), а не процентами: процент
 * ничего не говорит о том, станет ли врага возможно убить.
 *
 * DPS в строке — тот, что будет С ЭТИМ оружием надетым. Общий DPS показывать
 * больше нельзя: бьёт только надетое, и прокачка снятого оружия давала бы
 * прирост в ноль на всех трёх строках, кроме одной.
 */
export function upgradeRows(
  stats: Stats,
  weapons: Record<DamageType, Weapon>,
  inventory: Inventory,
  reference: ByType,
): UpgradeRow[] {
  return TYPES.map((type) => {
    const weapon = weapons[type];
    const probe = new Weapon(type, weapon.rarity, weapon.level + 1);
    const dpsNow = totalDps(stats, weapons, reference, type);
    const dpsNext = totalDps(stats, { ...weapons, [type]: probe }, reference, type);
    return {
      type,
      rarity: weapon.rarity,
      level: weapon.level,
      title: `${TYPE_RU[type]} · ${RARITY_RU[weapon.rarity]} ур.${weapon.level}`,
      copies: inventory.get(type),
      cost: inventory.costFor(weapon),
      ready: inventory.canUpgrade(weapon),
      dpsNow,
      dpsNext,
    };
  });
}

/**
 * На малых числах округление до целого съедает прирост, и строка читается как
 * «DPS 14 → 14» — то есть будто уровень ничего не даёт. Поэтому до сотни
 * показываем десятые.
 */
export function formatDps(value: number): string {
  return value < 100 ? value.toFixed(1) : String(Math.round(value));
}
