import type { RegenEntry } from './BalanceTypes.ts';

/** Всё, что регену нужно от сущности: текущее HP, потолок и время последнего урона. */
export interface Regenerating {
  hp: number;
  readonly maxHp: number;
  /** Секунды игрового времени с последнего урона — полученного ИЛИ нанесённого. */
  timeSinceDamage: number;
}

/**
 * Реген вне боя по BALANCE.md §4. Окно открывается, только когда с последнего
 * урона прошло больше outOfCombatDelay.
 *
 * Реген врага намеренно выше регена игрока: отступление от почти убитого
 * противника должно быть болезненным. Это и есть весь скилл-слой игры.
 */
export function applyRegen(entity: Regenerating, profile: RegenEntry, dt: number): void {
  entity.timeSinceDamage += dt;
  if (entity.timeSinceDamage <= profile.outOfCombatDelay) return;
  entity.hp = Math.min(entity.maxHp, entity.hp + entity.maxHp * profile.rate * dt);
}

/** Сброс окна регена. Вызывается и на полученном, и на нанесённом уроне. */
export function resetRegen(entity: Regenerating): void {
  entity.timeSinceDamage = 0;
}

/** Секунды до открытия окна регена — для индикатора в HUD. */
export function timeUntilRegen(entity: Regenerating, profile: RegenEntry): number {
  return Math.max(0, profile.outOfCombatDelay - entity.timeSinceDamage);
}
