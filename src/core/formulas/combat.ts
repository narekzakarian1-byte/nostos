import type { DamageType } from '../BalanceTypes.ts';

// Чистые функции размена. Ни одна не читает balance.json: все числа приходят
// параметрами, иначе симулятор не смог бы гонять один и тот же расчёт на разных
// профилях баланса.

/** Значение по каждому из трёх типов урона — атаки или защиты. */
export type ByType = Record<DamageType, number>;

export const DAMAGE_TYPES: readonly DamageType[] = ['pierce', 'slash', 'crush'];

export interface DamageParams {
  readonly exponent: number;
  readonly floor: number;
  readonly ceil: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Отношение атаки к защите. Кормит и формулу урона, и цвет иконок над врагом —
 * поэтому иконка не может разойтись с реальным уроном.
 */
export function attackRatio(atk: number, def: number): number {
  return atk / Math.max(def, 1);
}

/** BALANCE.md §2.1: r^E / (1 + r^E), зажатое в пол и потолок. */
export function damageMultiplier(atk: number, def: number, p: DamageParams): number {
  const powered = attackRatio(atk, def) ** p.exponent;
  return clamp(powered / (1 + powered), p.floor, p.ceil);
}

export function damagePerHit(atk: number, def: number, p: DamageParams): number {
  return atk * damageMultiplier(atk, def, p);
}

/** Средний вклад крита: 1 + шанс * (множитель - 1). */
export function critFactor(chance: number, mult: number): number {
  return 1 + chance * (mult - 1);
}

/** BALANCE.md §2.2. */
export function dps(damage: number, attackSpeed: number, crit: number): number {
  return damage * attackSpeed * crit;
}

/**
 * BALANCE.md §2.3. Треугольник симметричен: урон врага срезается защитой того же
 * типа по той же кривой, по которой защита врага срезает урон игрока, и только
 * потом уклонением.
 *
 * Кривая общая с исходящим уроном намеренно. Своя формула на входящий означала бы,
 * что три иконки над врагом описывают лишь половину боя, а вторую половину игрок
 * читать не может ничем.
 */
export function incomingDamage(
  enemyDps: number,
  playerDef: number,
  p: DamageParams,
  dodge: number,
): number {
  return damagePerHit(enemyDps, playerDef, p) * (1 - dodge);
}

// Конверсии сырых статов в проценты, BALANCE.md §1. Насыщение нужно, чтобы
// первые вложения давали много, а поздние не ломали баланс островов.

export function critChanceFrom(raw: number, cap: number, k: number): number {
  return (cap * raw) / (raw + k);
}

export function dodgeChanceFrom(raw: number, cap: number, k: number): number {
  return (cap * raw) / (raw + k);
}

export function critMultFrom(raw: number, base: number, k: number): number {
  return base + raw / k;
}
