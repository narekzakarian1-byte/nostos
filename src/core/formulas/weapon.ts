// Чистые функции оружия. BALANCE.md §7.

export interface CopyCurve {
  readonly a: number;
  readonly b: number;
  readonly c: number;
}

/**
 * Оружие МНОЖИТ стат атаки, а не прибавляется к нему (CLAUDE.md правило 4).
 * При аддитивной модели уровень оружия перестаёт влиять на урон уже к третьему
 * острову, и вся система копий обесценивается.
 */
export function weaponMultiplier(rarityMult: number, levelStep: number, level: number): number {
  return rarityMult * (1 + levelStep * (level - 1));
}

/** BALANCE.md §7.3: ceil(a * L^b + c). */
export function copiesForNextLevel(level: number, curve: CopyCurve): number {
  return Math.ceil(curve.a * level ** curve.b + curve.c);
}

/** Сколько копий стоит путь с уровня from до уровня to. */
export function copiesToReach(from: number, to: number, curve: CopyCurve): number {
  let total = 0;
  for (let level = from; level < to; level++) total += copiesForNextLevel(level, curve);
  return total;
}

/**
 * Наследование уровня при повышении редкости — обязательное отличие от референса
 * (BALANCE.md §7.2). Без него фиолетовое первого уровня слабее синего пятидесятого,
 * и лучший дроп в игре делает игрока слабее.
 */
export function inheritedLevel(newLevel: number, bestOwnedLevel: number, enabled: boolean): number {
  return enabled ? Math.max(newLevel, bestOwnedLevel) : newLevel;
}
