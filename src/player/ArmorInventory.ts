import { getBalance } from '../core/Balance.ts';
import type { BalanceProfile, DamageType } from '../core/BalanceTypes.ts';
import { copiesForNextLevel, type CopyCurve } from '../core/formulas/weapon.ts';
import type { Armor } from './Armor.ts';

/**
 * Осколки брони — своя валюта, отдельная от копий оружия. Падают адресно, по типу
 * защиты, поэтому у игрока и здесь есть адрес: «меня рвёт дробящим — иду за
 * дробящей бронёй».
 *
 * Отдельный счётчик, а не общий с оружием: иначе каждый апгрейд атаки отнимал бы
 * у защиты, и выбор «бить сильнее или дольше жить» превратился бы в одну шкалу.
 */
export class ArmorInventory {
  private readonly shards: Record<DamageType, number> = { pierce: 0, slash: 0, crush: 0 };

  get(type: DamageType): number {
    return Math.floor(this.shards[type]);
  }

  add(type: DamageType, amount: number): void {
    this.shards[type] += amount;
  }

  private curve(): CopyCurve {
    const balance = getBalance();
    return balance.armorShards.profiles[balance.activeProfile as BalanceProfile];
  }

  /** Сколько осколков стоит следующий уровень этого сета. */
  costFor(armor: Armor): number {
    return copiesForNextLevel(armor.level, this.curve());
  }

  canUpgrade(armor: Armor): boolean {
    return this.get(armor.type) >= this.costFor(armor);
  }

  /** Тратит осколки и поднимает уровень. Возвращает false, если не хватило. */
  upgrade(armor: Armor): boolean {
    if (!this.canUpgrade(armor)) return false;
    this.shards[armor.type] -= this.costFor(armor);
    armor.level++;
    return true;
  }
}
