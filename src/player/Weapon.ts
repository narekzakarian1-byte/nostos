import { getBalance } from '../core/Balance.ts';
import type { DamageType, Rarity } from '../core/BalanceTypes.ts';
import { inheritedLevel, weaponMultiplier } from '../core/formulas/weapon.ts';

export const RARITY_ORDER: readonly Rarity[] = [
  'common', 'uncommon', 'rare', 'epic', 'legendary',
];

export const RARITY_RU: Record<Rarity, string> = {
  common: 'обычное',
  uncommon: 'зелёное',
  rare: 'синее',
  epic: 'фиолетовое',
  legendary: 'золотое',
};

export const TYPE_RU: Record<DamageType, string> = {
  pierce: 'копьё',
  slash: 'меч',
  crush: 'палица',
};

/**
 * Оружие МНОЖИТ стат атаки (CLAUDE.md правило 4):
 *   weaponMult = rarityMult * (1 + levelStep * (level - 1))
 */
export class Weapon {
  readonly type: DamageType;
  rarity: Rarity;
  level: number;

  constructor(type: DamageType, rarity: Rarity = 'common', level = 1) {
    this.type = type;
    this.rarity = rarity;
    this.level = level;
  }

  get multiplier(): number {
    const { rarityMult, levelStep } = getBalance().weapons;
    return weaponMultiplier(rarityMult[this.rarity], levelStep, this.level);
  }

  /** Следующая ступень редкости, или null если это уже золотое. */
  get nextRarity(): Rarity | null {
    const index = RARITY_ORDER.indexOf(this.rarity);
    return RARITY_ORDER[index + 1] ?? null;
  }

  /**
   * Получение оружия более высокой редкости того же типа (BALANCE.md §7.2).
   * Уровень наследуется — иначе фиолетовое первого уровня оказывается слабее
   * синего пятидесятого, и лучший дроп в игре делает игрока слабее.
   * Это правило 5 из CLAUDE.md, выключать нельзя.
   */
  static onAcquire(dropped: Weapon, owned: Weapon): Weapon {
    const { inheritLevelOnRarityUp, rarityMult } = getBalance().weapons;
    if (rarityMult[dropped.rarity] <= rarityMult[owned.rarity]) return owned;
    dropped.level = inheritedLevel(dropped.level, owned.level, inheritLevelOnRarityUp);
    return dropped;
  }
}

/** Стартовый набор: по одному обычному оружию первого уровня на каждый тип. */
export function startingWeapons(): Record<DamageType, Weapon> {
  return {
    pierce: new Weapon('pierce'),
    slash: new Weapon('slash'),
    crush: new Weapon('crush'),
  };
}
