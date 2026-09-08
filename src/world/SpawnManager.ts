import { getBalance } from '../core/Balance.ts';
import type { DamageType, EnemyArchetype } from '../core/BalanceTypes.ts';
import type { Rng } from '../core/Rng.ts';
import { blocked, blockersOf, type Blocker } from './Blockers.ts';
import { placeLandmarks } from './Decor.ts';
import { loadNodes, saveNodes, type NodeSave } from '../save/Save.ts';
import { bossArenaPoint, createBoss } from './Boss.ts';
import { createEnemy, type EnemySpec } from './EnemyFactory.ts';
import { currentIslandId } from './Island.ts';
import { islandLayout, toWorld, zoneRect, type IslandLayout, type Rect } from './Layout.ts';
import { makePatrol, patrolPoint, randomPhase } from './Patrol.ts';
import type { Enemy, FarmTier } from './Enemy.ts';

const TYPES: readonly DamageType[] = ['pierce', 'slash', 'crush'];
/** След узла на земле. Чуть шире игрокова: к врагу нужно не просто пролезть,
 *  а встать рядом и драться. */
const FOOT = { rx: 22, ry: 11 };

function tierSize(tier: FarmTier): number {
  return getBalance().render.enemySizeByTier[tier];
}
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
  /**
   * Следы ландмарков зоны. Узел, севший внутрь храма или хижины, молча
   * выпадает из игры: подойти к нему уже нельзя, а на карте он есть.
   *
   * Считаются здесь, а не берутся из Scenery, потому что порядок обратный:
   * сначала узлы, потом декор — декор обтекает узлы, а не наоборот. Ландмарки
   * при этом стоят в точках файла раскладки безусловно, то есть известны
   * заранее и без Scenery.
   */
  private landmarks: readonly Blocker[] = [];

  constructor(rng: Rng, seed: number, bounds: WorldBounds) {
    this.rng = rng;
    this.seed = seed;
    const n = getBalance().prototype.islandNumber;
    const layout = islandLayout(currentIslandId());

    // Босс ставится первым и получает своё место безусловно: арена — точка
    // острова, вокруг которой раскладывается всё остальное, а не наоборот.
    // Дальше findSpot держит от неё дистанцию наравне с прочими узлами.
    const arena = layout
      ? toWorld(layout.arena, bounds)
      : bossArenaPoint(bounds.width, bounds.height);
    this.boss = createBoss(n, arena.x, arena.y);
    this.enemies.push(this.boss);

    if (layout) {
      this.landmarks = blockersOf(placeLandmarks(layout, bounds));
      this.populateByLayout(layout, bounds, n);
    }
    else this.populateAtRandom(bounds, n);

    this.restore();
  }

  /**
   * Раскладка по авторской схеме острова (world/Layout.ts).
   *
   * Вожди стоят поимённо и в своих точках — к ним ходят адресно, и «Мирон
   * Молот у давильни» обязан оказаться у давильни, а не там, куда упали кости.
   * Обычные и элиты сеются внутри своей зоны по её бюджету: этим и задаётся
   * градиент сложности по главной оси острова — у высадки только обычные,
   * элиты выше и по бокам, босс наверху.
   */
  private populateByLayout(layout: IslandLayout, bounds: WorldBounds, n: number): void {
    let index = 0;

    for (const chief of layout.minibosses) {
      const spot = toWorld(chief.at, bounds);
      this.addNode(bounds, n, {
        x: spot.x, y: spot.y,
        weakness: chief.weakness,
        tier: 'miniboss',
        archetype: ARCHETYPES[index % ARCHETYPES.length]!,
        copyType: chief.copyType,
      });
      index++;
    }

    // Элиты раньше обычных: в тесной зоне первый получает место с зазором,
    // а к элите игрок ходит адресно и слипшейся с соседом она быть не должна.
    for (const tier of ['elite', 'normal'] as const) {
      for (const zone of layout.zones) {
        const count = zone.nodes[tier] ?? 0;
        for (let i = 0; i < count; i++) {
          const spot = this.findSpotIn(bounds, zoneRect(zone, bounds), tier);
          this.addNode(bounds, n, {
            x: spot.x, y: spot.y,
            weakness: TYPES[index % TYPES.length]!,
            tier,
            archetype: ARCHETYPES[index % ARCHETYPES.length]!,
            copyType: TYPES[i % TYPES.length]!,
          });
          index++;
        }
      }
    }
  }

  /** Прежняя случайная раскладка. Держится для островов без своей схемы. */
  private populateAtRandom(bounds: WorldBounds, n: number): void {
    const { islands } = getBalance();
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
        const spot = this.findSpotIn(bounds, worldRect(bounds), tier);
        this.addNode(bounds, n, {
          x: spot.x, y: spot.y,
          weakness: TYPES[index % TYPES.length]!,
          tier,
          archetype: ARCHETYPES[index % ARCHETYPES.length]!,
          copyType: TYPES[i % TYPES.length]!,
        });
        index++;
      }
    }
  }

  /** Узел на карте вместе с его маршрутом. Общий хвост обеих раскладок. */
  private addNode(bounds: WorldBounds, n: number, spec: EnemySpec): void {
    const enemy = createEnemy(spec, n);
    // Маршрут кладётся после создания, а не в конструктор: враг остаётся
    // данными боя, а Patrol — отдельным слоем поверх, который симулятор
    // баланса не подключает вовсе.
    enemy.patrol = makePatrol(
      this.rng, spec.tier, spec.x, spec.y, this.roomAround(bounds, spec),
    );
    // Фаза выбирается не вслепую: маршрут может увести узел на полсотни
    // единиц от якоря и посадить его внутрь ландмарка, поставленного рукой.
    // Внутрь препятствия узел попадать не должен вообще — подойти к нему уже
    // нельзя, а на карте он есть.
    enemy.progress = randomPhase(this.rng);
    let start = patrolPoint(enemy.patrol, enemy.progress);
    for (let tries = 0; tries < 12; tries++) {
      if (!this.insideLandmark(start.x, start.y, enemy.size)) break;
      enemy.progress = randomPhase(this.rng);
      start = patrolPoint(enemy.patrol, enemy.progress);
    }
    enemy.x = start.x;
    enemy.y = start.y;
    this.enemies.push(enemy);
  }

  /** Позиция внутри прямоугольника с зазором до соседей: слипшиеся узлы
   *  убивают решение «куда встать». */
  private findSpotIn(b: WorldBounds, area: Rect, tier: FarmTier): { x: number; y: number } {
    const { enemyMinSpacing, enemySpawnMargin } = getBalance().render;
    const { engageRange } = getBalance().combat;
    // Границы мира режут прямоугольник зоны: у краевых зон часть площади
    // уходит под отбивку, и узел там оказался бы наполовину за островом.
    const left = Math.max(area.x, enemySpawnMargin);
    const right = Math.min(area.x + area.width, b.width - enemySpawnMargin);
    const top = Math.max(area.y, b.top);
    const bottom = Math.min(area.y + area.height, b.height - enemySpawnMargin);
    let candidate = { x: (left + right) / 2, y: (top + bottom) / 2 };

    for (let i = 0; i < 300; i++) {
      candidate = { x: this.rng.range(left, right), y: this.rng.range(top, bottom) };
      // Игрок не должен просыпаться уже в бою.
      if (distance(candidate, b.startX, b.startY) < engageRange * 2) continue;
      if (this.insideLandmark(candidate.x, candidate.y, tierSize(tier))) continue;
      const tooClose = this.enemies.some(
        (e) => distance(candidate, e.x, e.y) < enemyMinSpacing,
      );
      if (!tooClose) break;
    }
    return candidate;
  }

  /**
   * Стоит ли фигура внутри следа ландмарка. Считается по ТОЧКЕ КАСАНИЯ земли
   * (y + половина роста), а не по центру: следом меряется земля под ногами.
   */
  private insideLandmark(x: number, y: number, size: number): boolean {
    return blocked(x, y + size / 2, FOOT, this.landmarks);
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

function worldRect(bounds: WorldBounds): Rect {
  return { x: 0, y: 0, width: bounds.width, height: bounds.height };
}
