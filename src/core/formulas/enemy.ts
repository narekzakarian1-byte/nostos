import type { DamageType } from '../BalanceTypes.ts';
import { DAMAGE_TYPES, type ByType } from './combat.ts';

// Кривая острова и защиты врага. BALANCE.md §6.

export interface DefenseMults {
  readonly weaknessMult: number;
  readonly neutralMult: number;
  readonly resistMult: number;
}

/**
 * Обычный враг: слабый тип, нейтральный, стойкий.
 * Босс: слабый тип и два стойких — иначе расчётный DPS на острове 3 выходит 637
 * вместо 555 из калибровки BALANCE.md §5.4. С двумя стойкими получается 552.
 */
export type DefenseStyle = 'enemy' | 'boss';

/** Ротация задаёт, какой из двух оставшихся типов будет нейтральным. */
const NEUTRAL_OF: Record<DamageType, DamageType> = {
  pierce: 'slash',
  slash: 'crush',
  crush: 'pierce',
};

export function islandPower(powerBase: number, n: number): number {
  return powerBase ** (n - 1);
}

export function enemyHp(baseHp: number, power: number, hpMult: number): number {
  return baseHp * power * hpMult;
}

export function enemyDps(baseDps: number, power: number, dpsMult: number): number {
  return baseDps * power * dpsMult;
}

export function enemyBaseDef(baseDef: number, power: number, defMult: number): number {
  return baseDef * power * defMult;
}

export function defenseByType(
  weakness: DamageType | 'any',
  base: number,
  mults: DefenseMults,
  style: DefenseStyle,
): ByType {
  const def = { pierce: 0, slash: 0, crush: 0 };
  // Итака: финальный босс уязвим ко всем трём типам сразу.
  if (weakness === 'any') {
    for (const type of DAMAGE_TYPES) def[type] = base * mults.weaknessMult;
    return def;
  }

  const neutral = NEUTRAL_OF[weakness];
  const otherMult = style === 'boss' ? mults.resistMult : mults.neutralMult;
  for (const type of DAMAGE_TYPES) {
    if (type === weakness) def[type] = base * mults.weaknessMult;
    else if (type === neutral) def[type] = base * otherMult;
    else def[type] = base * mults.resistMult;
  }
  return def;
}

/** Реген босса в бою — единственный рычаг жёсткости всех гейтов (BALANCE.md §5.1). */
export function bossRegenPerSecond(bossMaxHp: number, rate: number): number {
  return bossMaxHp * rate;
}
