import { getBalance } from '../core/Balance.ts';
import type { DamageType, EnemyArchetype } from '../core/BalanceTypes.ts';
import type { Rng } from '../core/Rng.ts';
import { loadNodes, saveNodes, type NodeSave } from '../save/Save.ts';
import { bossArenaPoint, createBoss } from './Boss.ts';
import { createEnemy, type EnemySpec } from './EnemyFactory.ts';
import { makePatrol, patrolPoint, randomPhase } from './Patrol.ts';
import type { Enemy, FarmTier } from './Enemy.ts';

const TYPES: readonly DamageType[] = ['pierce', 'slash', 'crush'];
const ARCHETYPES: readonly EnemyArchetype[] = ['fast', 'armored', 'heavy', 'striker'];

export interface WorldBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly startX: number;
  readonly startY: number;
}

/**
 * Раскладка узлов острова и их таймеры. Узлы персистентны: убитый помнит время
 * воскрешения и переживает перезагрузку страницы.
 */
export class SpawnManager {
  readonly enemies: Enemy[] = [];
  /** Островной босс. Стоит в общем списке узлов, чтобы бой, рендер и таймеры
   *  работали для него теми же путями, что и для всех остальных. */
  readonly boss: Enemy;
  private readonly rng: Rng;
  private readonly seed: number;

  constructor(rng: Rng, seed: number, bounds: WorldBounds) {
    this.rng = rng;
    this.seed = seed;
    const { islands, prototype } = getBalance();
    const n = prototype.islandNumber;

    // Босс ставится первым и получает своё место безусловно: арена — точка
    // острова, вокруг которой раскладывается всё остальное, а не наоборот.
    // Дальше findSpot держит от неё дистанцию наравне с прочими узлами.
    const arena = bossArenaPoint(bounds.width, bounds.height);
    this.boss = createBoss(n, arena.x, arena.y);
    this.enemies.push(this.boss);

    // Порядок важен: мини-боссы ставятся первыми и получают лучшие места,
    // потому что к ним игрок ходит адресно.
    const plan: readonly [FarmTier, number][] = [
      ['miniboss', islands.minibossesPerIsland],
      ['elite', islands.elitesPerIsland],
      ['normal', islands.normalsPerIsland],
    ];

    let index = 0;
    for (const [tier, count] of plan) {
      for (let i = 0; i < count; i++) {
        const spot = this.findSpot(bounds);
        const spec: EnemySpec = {
          x: spot.x,
          y: spot.y,
          weakness: TYPES[index % TYPES.length]!,
          tier,
          archetype: ARCHETYPES[index % ARCHETYPES.length]!,
          copyType: TYPES[i % TYPES.length]!,
        };
        const enemy = createEnemy(spec, n);
        // Маршрут кладётся после создания, а не в конструктор: враг остаётся
        // данными боя, а Patrol — отдельным слоем поверх, который симулятор
        // баланса не подключает вовсе.
        enemy.patrol = makePatrol(this.rng, tier, spot.x, spot.y, this.roomAround(bounds, spot));
        enemy.progress = randomPhase(this.rng);
        const start = patrolPoint(enemy.patrol, enemy.progress);
        enemy.x = start.x;
        enemy.y = start.y;
        this.enemies.push(enemy);
        index++;
      }
    }

    this.restore();
  }

  /** Позиция с зазором до соседей: слипшиеся узлы убивают решение «куда встать». */
  private findSpot(b: WorldBounds): { x: number; y: number } {
    const { enemyMinSpacing, enemySpawnMargin } = getBalance().render;
    const { engageRange } = getBalance().combat;
    let candidate = { x: b.width / 2, y: b.height / 2 };

    for (let i = 0; i < 300; i++) {
      candidate = {
        x: this.rng.range(enemySpawnMargin, b.width - enemySpawnMargin),
        y: this.rng.range(b.top, b.height - enemySpawnMargin),
      };
      // Игрок не должен просыпаться уже в бою.
      if (distance(candidate, b.startX, b.startY) < engageRange * 2) continue;
      const tooClose = this.enemies.some(
        (e) => distance(candidate, e.x, e.y) < enemyMinSpacing,
      );
      if (!tooClose) break;
    }
    return candidate;
  }

  /** Сколько места у якоря до ближайшего края: фигура не должна вылезать за остров. */
  private roomAround(b: WorldBounds, spot: { x: number; y: number }): number {
    const { enemySpawnMargin } = getBalance().render;
    return Math.min(
      spot.x - enemySpawnMargin,
      b.width - enemySpawnMargin - spot.x,
      spot.y - b.top,
      b.height - enemySpawnMargin - spot.y,
    );
  }

  scheduleRespawn(enemy: Enemy): void {
    const [min, max] = getBalance().enemyTiers[enemy.tier].respawnSec;
    enemy.kill();
    enemy.respawnIn = this.rng.range(min, max);
    enemy.respawnTotal = enemy.respawnIn;
    this.persist();
  }

  tick(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) continue;
      enemy.respawnIn -= dt;
      if (enemy.respawnIn <= 0) enemy.revive();
    }
  }

  /** Дев-панель: поднять всех немедленно. */
  resetTimers(): void {
    for (const enemy of this.enemies) if (!enemy.alive) enemy.revive();
    this.persist();
  }

  /**
   * На диск уходит абсолютное время, в сессии таймер идёт в игровом времени.
   * Поэтому ускорение времени из дев-панели работает, но не портит сохранение.
   */
  persist(): void {
    const now = Date.now();
    const nodes: NodeSave[] = [];
    this.enemies.forEach((enemy, i) => {
      if (!enemy.alive) nodes.push({ i, at: now + enemy.respawnIn * 1000 });
    });
    saveNodes(this.seed, nodes);
  }

  private restore(): void {
    const nodes = loadNodes(this.seed);
    if (!nodes) return;
    const now = Date.now();
    for (const node of nodes) {
      const enemy = this.enemies[node.i];
      if (!enemy) continue;
      const left = (node.at - now) / 1000;
      if (left <= 0) continue;
      enemy.kill();
      enemy.respawnIn = left;
      // Изначальная длительность в сохранении не лежит: восстановленный узел
      // начинает дугу с полной. Врать это не может — время до воскрешения
      // под дугой написано числом.
      enemy.respawnTotal = left;
    }
  }
}

function distance(p: { x: number; y: number }, x: number, y: number): number {
  return Math.hypot(p.x - x, p.y - y);
}
