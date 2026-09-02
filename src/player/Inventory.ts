import { getBalance } from '../core/Balance.ts';
import type { BalanceProfile, DamageType } from '../core/BalanceTypes.ts';
import { copiesForNextLevel, type CopyCurve } from '../core/formulas/weapon.ts';
import type { Weapon } from './Weapon.ts';

/**
 * Копии — единственная валюта прокачки. Падают с мини-боссов адресно, по типу
 * оружия, поэтому у игрока всегда есть цель: «нужна палица — иду к тому врагу».
 */
export class Inventory {
  private readonly copies: Record<DamageType, number> = { pierce: 0, slash: 0, crush: 0 };

  get(type: DamageType): number {
    return Math.floor(this.copies[type]);
  }

  add(type: DamageType, amount: number): void {
    this.copies[type] += amount;
  }

  private curve(): CopyCurve {
    const balance = getBalance();
    return balance.copies.profiles[balance.activeProfile as BalanceProfile];
  }

  /** Сколько копий стоит следующий уровень этого оружия. */
  costFor(weapon: Weapon): number {
    return copiesForNextLevel(weapon.level, this.curve());
  }

  canUpgrade(weapon: Weapon): boolean {
    return this.get(weapon.type) >= this.costFor(weapon);
  }

  /** Тратит копии и поднимает уровень. Возвращает false, если копий не хватило. */
  upgrade(weapon: Weapon): boolean {
    if (!this.canUpgrade(weapon)) return false;
    this.copies[weapon.type] -= this.costFor(weapon);
    weapon.level++;
    return true;
  }
}
