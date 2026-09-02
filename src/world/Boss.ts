import { getBalance } from '../core/Balance.ts';
import { bossRegenPerSecond } from '../core/formulas/enemy.ts';
import { defenseProfile } from './EnemyFactory.ts';
import { Enemy } from './Enemy.ts';
import { enemyDps, enemyMaxHp, islandDef } from './Island.ts';

/**
 * Островной босс — гейт острова (GDD §6).
 *
 * От обычного врага отличается тремя вещами, и все три несут смысл:
 *   1. регенерирует ПРЯМО В БОЮ, всегда — единственный регулятор жёсткости
 *      гейта. Не хватает урона — упираешься в потолок своего DPS, а не в стену;
 *   2. два не-слабых типа у него стойкие, а не нейтральные (formulas/enemy.ts),
 *      поэтому правильное оружие решает, а не просто помогает;
 *   3. стоит на арене и никуда не ходит: к гейту приходят, он не приходит сам.
 */
export function createBoss(n: number, x: number, y: number): Enemy {
  const { islands } = getBalance();
  const island = islandDef(n);
  const weakness = island.bossWeakness;

  const boss = new Enemy(
    x,
    y,
    enemyMaxHp(n, 'boss'),
    enemyDps(n, 'boss'),
    defenseProfile(weakness, n, 'boss', 'boss'),
    weakness,
    'boss',
    islands.bossArchetype,
    // Копий босс не даёт (BALANCE.md §7.4), но тип нужен всем, кто читает узел:
    // значок под ногами показывает, каким оружием его берут. У Итаки слабы все
    // три, поэтому берётся первый слот — любой из них одинаково верен.
    weakness === 'any' ? getBalance().weapons.slots[0]! : weakness,
  );
  // Маршрута нет: patrol остаётся null, и Enemy.tickPatrol сразу выходит.
  return boss;
}

/**
 * Реген босса в бою. Вызывается КАЖДЫЙ тик, независимо от того, бьют его или
 * нет — в этом весь смысл: `net_DPS = player_DPS - maxHP * bossCombatRegen`
 * (BALANCE.md §5.1). Обычное окно регена вне боя к боссу не применяется.
 */
export function applyBossRegen(boss: Enemy, dt: number): void {
  boss.hp = Math.min(boss.maxHp, boss.hp + bossRegen(boss) * dt);
}

/** Сколько HP босс отращивает в секунду. Из него же считается чистый DPS. */
export function bossRegen(boss: Enemy): number {
  return bossRegenPerSecond(boss.maxHp, getBalance().regen.bossCombatRegen);
}

/** Точка арены: верх острова по центру. Игрок стартует внизу и идёт к ней. */
export function bossArenaPoint(worldWidth: number, worldHeight: number): { x: number; y: number } {
  const { render } = getBalance();
  const screenHeight = worldHeight / render.worldScreensY;
  return {
    x: worldWidth / 2,
    y: screenHeight * render.bossArena.insetScreens,
  };
}
