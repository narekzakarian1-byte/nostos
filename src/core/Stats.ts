import { getBalance } from './Balance.ts';
import type { BaseStats, DamageType, StatKey } from './BalanceTypes.ts';
import { critChanceFrom, critMultFrom, dodgeChanceFrom } from './formulas/combat.ts';

/**
 * Одиннадцать характеристик игрока плюс урон крита, и конверсия сырых значений
 * в проценты по BALANCE.md §1. Конверсия с насыщением: первые вложения дают много,
 * дальше всё меньше — иначе крит ломает баланс на поздних островах.
 */
export class Stats {
  private readonly values: Record<StatKey, number>;

  constructor(base?: BaseStats) {
    this.values = { ...(base ?? getBalance().player.baseStats) };
  }

  get(key: StatKey): number {
    return this.values[key];
  }

  set(key: StatKey, value: number): void {
    this.values[key] = value;
  }

  keys(): StatKey[] {
    return Object.keys(this.values) as StatKey[];
  }

  atk(type: DamageType): number {
    return this.values[`${type}Atk`];
  }

  def(type: DamageType): number {
    return this.values[`${type}Def`];
  }

  get maxHp(): number {
    return this.values.maxHp;
  }

  get moveSpeed(): number {
    return this.values.moveSpeed;
  }

  get critChance(): number {
    const { critCap, kCrit } = getBalance().statConversion;
    return critChanceFrom(this.values.crit, critCap, kCrit);
  }

  get dodgeChance(): number {
    const { dodgeCap, kDodge } = getBalance().statConversion;
    return dodgeChanceFrom(this.values.dodge, dodgeCap, kDodge);
  }

  get critMult(): number {
    const { critMultBase, kCritDamage } = getBalance().statConversion;
    return critMultFrom(this.values.critDamage, critMultBase, kCritDamage);
  }
}
