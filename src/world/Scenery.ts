import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { Enemy } from './Enemy.ts';
import { grassTufts, type GrassTuft } from './Grass.ts';
import { roadStones, type RoadStone } from './Road.ts';

/** Совпадает с PropId в ui/props/Models.ts — тип не импортируется оттуда,
 *  чтобы world/ не тянул зависимость на ui/ (CLAUDE.md: слои разделены). */
export type DecorId =
  | 'prop-column'
  | 'prop-column-broken'
  | 'prop-column-drum'
  | 'prop-ruin-gate'
  | 'prop-amphora'
  | 'prop-rock'
  | 'prop-rock-small'
  | 'prop-rubble'
  | 'prop-campfire';

// Якорь кластера — то крупное, вокруг чего собирается группа. Ворота вдвое
// выше игрока и перекрывают его собой, поэтому это один слот из восьми:
// попадайся они наравне с обломками, остров превратился бы в частокол,
// сквозь который не видно врагов.
const ANCHORS: readonly DecorId[] = [
  'prop-column', 'prop-column-broken', 'prop-ruin-gate', 'prop-column-broken',
  'prop-campfire', 'prop-column', 'prop-column-broken', 'prop-rock',
];

// Мелочь вокруг якоря. Её большинство, и она намеренно низкая: плитки и камни
// набирают плотность картинки, но не перекрывают врагов и не спорят за
// внимание с тремя иконками над ними.
const SATELLITES: readonly DecorId[] = [
  'prop-rubble', 'prop-rock', 'prop-rubble', 'prop-amphora', 'prop-rock-small',
  'prop-rubble', 'prop-column-drum', 'prop-rock', 'prop-rubble', 'prop-rock-small',
];

export interface DecorPlacement {
  readonly id: DecorId;
  readonly x: number;
  readonly y: number;
}

export interface SceneryBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly startX: number;
  readonly startY: number;
}

/**
 * Декор острова: россыпь пропов, дорога-стержень от старта игрока к дальнему
 * краю, прямоугольник границы. Никакого канваса — только данные, детерминированные
 * по сиду (CLAUDE.md §2). Рисует Renderer.ts.
 */
export class Scenery {
  readonly props: readonly DecorPlacement[];
  readonly roadPoints: readonly { x: number; y: number }[];
  /** Кладка дороги. Считается после стержня и тем же rng — прогон по сиду
   *  остаётся единой воспроизводимой последовательностью. */
  readonly roadStones: readonly RoadStone[];
  /** Пучки травы. Сеются последними — тем же rng, одной цепочкой по сиду. */
  readonly grass: readonly GrassTuft[];
  readonly border: { x: number; y: number; width: number; height: number };

  constructor(rng: Rng, bounds: SceneryBounds, enemies: readonly Enemy[]) {
    this.props = scatterProps(rng, bounds, enemies);
    this.roadPoints = roadSpine(rng, bounds);
    this.roadStones = roadStones(rng, this.roadPoints);
    this.grass = grassTufts(rng, bounds);
    const { borderInset } = getBalance().scenery;
    this.border = {
      x: borderInset,
      y: bounds.top + borderInset,
      width: bounds.width - borderInset * 2,
      height: bounds.height - bounds.top - borderInset * 2,
    };
  }
}

function scatterProps(
  rng: Rng,
  bounds: SceneryBounds,
  enemies: readonly Enemy[],
): DecorPlacement[] {
  const { scenery } = getBalance();
  const placed: DecorPlacement[] = [];
  const centers: { x: number; y: number }[] = [];

  for (let cluster = 0; placed.length < scenery.propCount; cluster++) {
    const center = clusterCenter(rng, bounds, enemies, centers);
    centers.push(center);
    placed.push({ id: ANCHORS[cluster % ANCHORS.length]!, x: center.x, y: center.y });

    const around: DecorPlacement[] = [];
    for (let i = 0; i < scenery.clusterSatellites; i++) {
      if (placed.length + around.length >= scenery.propCount) break;
      const id = SATELLITES[(cluster * scenery.clusterSatellites + i) % SATELLITES.length]!;
      around.push({ id, ...satelliteSpot(rng, bounds, center, around) });
    }
    placed.push(...around);
  }

  return placed;
}

/**
 * Место под кластер: не в упор к врагу и не вплотную к соседнему кластеру.
 * Не нашли за 30 попыток — ставим последний кандидат как есть: декор не обязан
 * быть идеальным в отличие от узлов SpawnManager.
 */
function clusterCenter(
  rng: Rng,
  bounds: SceneryBounds,
  enemies: readonly Enemy[],
  centers: readonly { x: number; y: number }[],
): { x: number; y: number } {
  const { scenery } = getBalance();
  let spot = { x: bounds.width / 2, y: bounds.height / 2 };

  for (let attempt = 0; attempt < 30; attempt++) {
    spot = {
      x: rng.range(20, bounds.width - 20),
      y: rng.range(bounds.top + 20, bounds.height - 20),
    };
    const nearEnemy = enemies.some(
      (e) => Math.hypot(e.x - spot.x, e.y - spot.y) < scenery.minSpacingFromEnemies,
    );
    const nearCluster = centers.some(
      (c) => Math.hypot(c.x - spot.x, c.y - spot.y) < scenery.clusterSpacing,
    );
    if (!nearEnemy && !nearCluster) break;
  }

  return spot;
}

/** Спутник садится в кольцо вокруг якоря и не влезает в уже поставленных соседей. */
function satelliteSpot(
  rng: Rng,
  bounds: SceneryBounds,
  center: { x: number; y: number },
  around: readonly DecorPlacement[],
): { x: number; y: number } {
  const { scenery } = getBalance();
  let spot = center;

  for (let attempt = 0; attempt < 8; attempt++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(scenery.clusterInner, scenery.clusterRadius);
    spot = {
      x: clamp(center.x + Math.cos(angle) * dist, 20, bounds.width - 20),
      y: clamp(center.y + Math.sin(angle) * dist, bounds.top + 20, bounds.height - 20),
    };
    const crowded = around.some(
      (p) => Math.hypot(p.x - spot.x, p.y - spot.y) < scenery.minSpacingInCluster,
    );
    if (!crowded) break;
  }

  return spot;
}

/**
 * Ломаная через весь остров, от нижнего края к верхнему, с боковым дрожанием.
 * Именно от края, а не от точки старта: дорога, обрывающаяся под ногами
 * игрока, читается как недорисованная.
 */
function roadSpine(rng: Rng, bounds: SceneryBounds): { x: number; y: number }[] {
  const { scenery } = getBalance();
  const points: { x: number; y: number }[] = [{ x: bounds.startX, y: bounds.height }];

  const segments = Math.max(1, scenery.roadWaypoints - 1);
  const totalRise = bounds.height - bounds.top;
  for (let i = 1; i <= segments; i++) {
    const y = bounds.height - (totalRise * i) / segments;
    const x = bounds.startX + rng.range(-scenery.roadJitter, scenery.roadJitter);
    points.push({ x: clamp(x, 20, bounds.width - 20), y });
  }

  return points;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
