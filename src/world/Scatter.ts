import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { DecorPlacement } from './Decor.ts';
import type { Enemy } from './Enemy.ts';
import type { Rect } from './Layout.ts';
import { distanceToPaths, type RoadPath } from './Road.ts';

/**
 * Геометрия расстановки: куда сесть группе и куда её мелочи.
 *
 * Отдельно от Decor.ts, который знает, ЧТО ставить, потому что правила «не в
 * упор к врагу, не на дорогу, не за краем мира» одни и те же для авторского
 * острова и для случайного, а наборы предметов у них разные.
 */
export interface Point {
  x: number;
  y: number;
}

export interface ScatterBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
}

/**
 * Место под кластер внутри отведённого прямоугольника: не в упор к врагу, не
 * вплотную к соседнему кластеру и не на дороге. Не нашли за 30 попыток —
 * ставим последний кандидат как есть: декор не обязан быть идеальным в отличие
 * от узлов SpawnManager.
 */
export function clusterCenter(
  rng: Rng,
  area: Rect,
  enemies: readonly Enemy[],
  centers: readonly Point[],
  roads: readonly RoadPath[],
): Point {
  const { scenery } = getBalance();
  let spot = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  // Запасной вариант: место, свободное хотя бы от дороги. В узкой зоне,
  // которую тракт делит пополам, всех условий сразу может не найтись — и
  // тогда лучше поставить кластер тесно к соседу, чем посреди дороги.
  let offRoad: Point | null = null;

  for (let attempt = 0; attempt < 30; attempt++) {
    spot = {
      x: rng.range(area.x, area.x + area.width),
      y: rng.range(area.y, area.y + area.height),
    };
    if (onRoad(roads, spot)) continue;
    offRoad ??= spot;
    const nearEnemy = enemies.some(
      (e) => Math.hypot(e.x - spot.x, e.y - spot.y) < scenery.minSpacingFromEnemies,
    );
    const nearCluster = centers.some(
      (c) => Math.hypot(c.x - spot.x, c.y - spot.y) < scenery.clusterSpacing,
    );
    if (!nearEnemy && !nearCluster) return spot;
  }

  return offRoad ?? spot;
}

/** Спутник садится в кольцо вокруг якоря и не влезает в уже поставленных соседей. */
export function satelliteSpot(
  rng: Rng,
  area: Rect,
  center: Point,
  around: readonly DecorPlacement[],
  roads: readonly RoadPath[],
): Point {
  const { scenery } = getBalance();
  let spot = center;
  let offRoad: Point | null = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(scenery.clusterInner, scenery.clusterRadius);
    spot = {
      x: clamp(center.x + Math.cos(angle) * dist, area.x, area.x + area.width),
      y: clamp(center.y + Math.sin(angle) * dist, area.y, area.y + area.height),
    };
    if (onRoad(roads, spot)) continue;
    offRoad ??= spot;
    const crowded = around.some(
      (p) => Math.hypot(p.x - spot.x, p.y - spot.y) < scenery.minSpacingInCluster,
    );
    if (!crowded) return spot;
  }

  // Ни одной свободной точки в кольце: садим спутник на сам якорь. Он там
  // заведомо не на дороге — якорь уже проверен.
  return offRoad ?? center;
}

/**
 * Проп на дороге — самый заметный признак раскиданного, а не поставленного
 * декора: телега поперёк тракта читается как ошибка, а не как разорённая
 * деревня. Полоса свободы шире самой дороги на roadClearance.
 */
function onRoad(roads: readonly RoadPath[], spot: Point): boolean {
  const { roadClearance } = getBalance().scenery;
  for (const path of roads) {
    if (distanceToPaths(path.points, spot.x, spot.y) < path.width / 2 + roadClearance) {
      return true;
    }
  }
  return false;
}

/** Прямоугольник, обрезанный краями мира с отбивкой: проп не должен вылезать за остров. */
export function clampRect(rect: Rect, bounds: ScatterBounds): Rect {
  const { propMargin } = getBalance().scenery;
  const left = Math.max(rect.x, propMargin);
  const right = Math.min(rect.x + rect.width, bounds.width - propMargin);
  const top = Math.max(rect.y, bounds.top + propMargin);
  const bottom = Math.min(rect.y + rect.height, bounds.height - propMargin);
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
