import { getBalance } from '../core/Balance.ts';
import type { DamageType, Rarity } from '../core/BalanceTypes.ts';
import { inheritedLevel, weaponMultiplier } from '../core/formulas/weapon.ts';
import { RARITY_ORDER } from './Weapon.ts';

export const ARMOR_TYPE_RU: Record<DamageType, string> = {
  pierce: 'колющая',
  slash: 'рубящая',
  crush: 'дробящая',
};

/**
 * Броня МНОЖИТ стат защиты — зеркало оружия (BALANCE.md §7.5):
 *   armorMult = rarityMult * (1 + levelStep * (level - 1))
 *
 * Без этого множителя трек выживания растёт одним приростом с убитых, а трек
 * атаки — приростом, помноженным на оружие. Экспонента врага одна на обе стороны,
 * и одним рычагом прироста их не свести: перебор параметров показал, что при любом
 * его значении либо игрок не доживает до сорока секунд боя с боссом на поздних
 * островах, либо боссы на ранних падают с первой попытки.
 *
 * Формула считается той же функцией, что у оружия, намеренно: две разные означали бы,
 * что атака и защита живут по разным законам, и калибровка §5.4 перестала бы сходиться.
 */
export class Armor {
  readonly type: DamageType;
  rarity: Rarity;
  level: number;

  constructor(type: DamageType, rarity: Rarity = 'common', level = 1) {
    this.type = type;
    this.rarity = rarity;
    this.level = level;
  }

  get multiplier(): number {
    const { rarityMult, levelStep } = getBalance().armor;
    return weaponMultiplier(rarityMult[this.rarity], levelStep, this.level);
  }

  /** Следующая ступень редкости, или null если это уже золотая. */
  get nextRarity(): Rarity | null {
    const index = RARITY_ORDER.indexOf(this.rarity);
    return RARITY_ORDER[index + 1] ?? null;
  }

  /**
   * Наследование уровня при повышении редкости — то же правило, что у оружия
   * (CLAUDE.md правило 5). Одно правило на всё снаряжение: если броня начнёт
   * приходить первого уровня, лучший дроп снова сделает игрока слабее.
   */
  static onAcquire(dropped: Armor, owned: Armor): Armor {
    const { inheritLevelOnRarityUp, rarityMult } = getBalance().armor;
    if (rarityMult[dropped.rarity] <= rarityMult[owned.rarity]) return owned;
    dropped.level = inheritedLevel(dropped.level, owned.level, inheritLevelOnRarityUp);
    return dropped;
  }
}

/** Стартовый набор: по одному обычному сету первого уровня на каждый тип защиты. */
export function startingArmor(): Record<DamageType, Armor> {
  return {
    pierce: new Armor('pierce'),
    slash: new Armor('slash'),
    crush: new Armor('crush'),
  };
}
