import { getBalance } from './Balance.ts';
import type { DamageType } from './BalanceTypes.ts';
import type { Stats } from './Stats.ts';
import * as f from './formulas/combat.ts';

// Тонкий слой над formulas/combat.ts: достаёт числа из конфига и знает про Stats
// и Weapon. Самих формул здесь нет — иначе игра и симулятор считали бы по-разному.

export type { ByType } from './formulas/combat.ts';
export { DAMAGE_TYPES, attackRatio } from './formulas/combat.ts';

/**
 * Всё, что нужно бою от снаряжения — оружия или брони. Структурный тип, чтобы
 * core не зависел от player. Один тип на обоих: множитель считается одной формулой
 * (BALANCE.md §7.5), и разделять его на два интерфейса значило бы намекать, что
 * атака и защита живут по разным законам.
 */
export interface GearLike {
  readonly multiplier: number;
}

function damageParams(): f.DamageParams {
  const { typeExponent, damageFloor, damageCeil } = getBalance().combat;
  return { exponent: typeExponent, floor: damageFloor, ceil: damageCeil };
}

export function damageMultiplier(atk: number, def: number): number {
  return f.damageMultiplier(atk, def, damageParams());
}

export function damagePerHit(atk: number, def: number): number {
  return f.damagePerHit(atk, def, damageParams());
}

/** Оружие МНОЖИТ стат атаки, а не прибавляется к нему (CLAUDE.md правило 4). */
export function weaponAttack(stats: Stats, type: DamageType, weapon: GearLike): number {
  return stats.atk(type) * weapon.multiplier;
}

export function critFactor(stats: Stats): number {
  return f.critFactor(stats.critChance, stats.critMult);
}

function attackByType(stats: Stats, weapons: Record<DamageType, GearLike>): f.ByType {
  return {
    pierce: weaponAttack(stats, 'pierce', weapons.pierce),
    slash: weaponAttack(stats, 'slash', weapons.slash),
    crush: weaponAttack(stats, 'crush', weapons.crush),
  };
}

/** Суммарный урон за один залп всеми тремя оружиями, без учёта крита. */
export function hitDamage(
  stats: Stats,
  weapons: Record<DamageType, GearLike>,
  enemyDef: f.ByType,
): number {
  return f.sumDamage(attackByType(stats, weapons), enemyDef, damageParams());
}

/**
 * Тип, который сейчас даёт больше всего урона по этой защите. Нужен юсу удара:
 * дуга и искры красятся цветом иконки именно этого типа, и всплеск на контакте
 * подтверждает то же решение, что и три иконки над врагом.
 */
export function bestType(
  stats: Stats,
  weapons: Record<DamageType, GearLike>,
  enemyDef: f.ByType,
): DamageType {
  const atk = attackByType(stats, weapons);
  const p = damageParams();
  let best: DamageType = f.DAMAGE_TYPES[0]!;
  let bestDamage = -1;
  for (const type of f.DAMAGE_TYPES) {
    const damage = f.damagePerHit(atk[type], enemyDef[type], p);
    if (damage > bestDamage) {
      bestDamage = damage;
      best = type;
    }
  }
  return best;
}

/** DPS по BALANCE.md §2.2. */
export function totalDps(
  stats: Stats,
  weapons: Record<DamageType, GearLike>,
  enemyDef: f.ByType,
): number {
  const { baseAttackSpeed } = getBalance().combat;
  return f.dps(hitDamage(stats, weapons, enemyDef), baseAttackSpeed, critFactor(stats));
}

/** Броня МНОЖИТ стат защиты — зеркало weaponAttack (BALANCE.md §7.5). */
export function armorDefense(stats: Stats, type: DamageType, armor: GearLike): number {
  return stats.def(type) * armor.multiplier;
}

/**
 * Средний множитель надетого сета. Им же множится здоровье, а не только защита.
 *
 * Без этого maxHp остаётся единственным статом вообще без множителя, и порог
 * T_death >= 40 с становится недостижим начиная с шестого острова даже при
 * бесконечной броне: damageFloor не даёт входящему урону упасть ниже 5% от урона
 * босса, а тот растёт по экспоненте острова. Считается по трём сетам сразу —
 * носишь полный доспех, а бьют тебя всегда одним типом.
 */
export function armorHpMultiplier(armor: Record<DamageType, GearLike>): number {
  let total = 0;
  for (const type of f.DAMAGE_TYPES) total += armor[type].multiplier;
  return total / f.DAMAGE_TYPES.length;
}

/** Здоровье с учётом брони — единственный источник правды о потолке HP. */
export function effectiveMaxHp(stats: Stats, armor: Record<DamageType, GearLike>): number {
  return stats.maxHp * armorHpMultiplier(armor);
}

/**
 * Входящий урон по BALANCE.md §2.3: против защиты того типа, которым бьёт враг.
 *
 * `attackType` берётся из слабости врага — кто уязвим к рубящему, тот рубящим и
 * бьёт (GDD §4.2). 'any' — только финальный босс: он бьёт всеми тремя сразу, и
 * урон делится поровну, зеркально тому, как его собственная защита по всем трём
 * типам считается слабой.
 */
export function incomingDps(
  enemyDps: number,
  attackType: DamageType | 'any',
  stats: Stats,
  armor: Record<DamageType, GearLike>,
): number {
  const p = damageParams();
  const dodge = stats.dodgeChance;
  if (attackType === 'any') {
    let total = 0;
    for (const type of f.DAMAGE_TYPES) {
      total += f.incomingDamage(enemyDps / f.DAMAGE_TYPES.length, defenseOf(stats, type, armor), p, dodge);
    }
    return total;
  }
  return f.incomingDamage(enemyDps, defenseOf(stats, attackType, armor), p, dodge);
}

function defenseOf(stats: Stats, type: DamageType, armor: Record<DamageType, GearLike>): number {
  return armorDefense(stats, type, armor[type]);
}
