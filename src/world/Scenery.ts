import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { Enemy } from './Enemy.ts';
import { grassTufts, type GrassTuft } from './Grass.ts';
import { islandLayout, toWorld, type IslandLayout, type LayoutPoint } from './Layout.ts';
import { roadStones, type RoadStone } from './Road.ts';

/** Совпадает с PropId в ui/props/Models.ts и PicturePropId в ui/props/Pictures.ts
 *  — типы не импортируются оттуда, чтобы world/ не тянул зависимость на ui/
 *  (CLAUDE.md: слои разделены). Чем проп нарисован — геометрией или картинкой —
 *  world/ не знает и знать не должен: здесь только раскладка по земле. */
export type DecorId =
  | 'prop-column'
  | 'prop-column-broken'
  | 'prop-column-drum'
  | 'prop-ruin-gate'
  | 'prop-amphora'
  | 'prop-rock'
  | 'prop-rock-small'
  | 'prop-rubble'
  | 'prop-campfire'
  | 'prop-vine-trellis'
  | 'prop-wine-press'
  | 'prop-cart-broken'
  | 'prop-palisade-burnt'
  | 'prop-hut-burnt';

interface DecorSet {
  /** Крупное, вокруг чего собирается группа. */
  readonly anchors: readonly DecorId[];
  /** Мелочь вокруг якоря. */
  readonly satellites: readonly DecorId[];
}

// Якорь кластера — то крупное, вокруг чего собирается группа. Ворота вдвое
// выше игрока и перекрывают его собой, поэтому это один слот из восьми:
// попадайся они наравне с обломками, остров превратился бы в частокол,
// сквозь который не видно врагов.
//
// Мелочи большинство, и она намеренно низкая: плитки и камни набирают
// плотность картинки, но не перекрывают врагов и не спорят за внимание с тремя
// иконками над ними.
const COMMON: DecorSet = {
  anchors: [
    'prop-column', 'prop-column-broken', 'prop-ruin-gate', 'prop-column-broken',
    'prop-campfire', 'prop-column', 'prop-column-broken', 'prop-rock',
  ],
  satellites: [
    'prop-rubble', 'prop-rock', 'prop-rubble', 'prop-amphora', 'prop-rock-small',
    'prop-rubble', 'prop-column-drum', 'prop-rock', 'prop-rubble', 'prop-rock-small',
  ],
};

/**
 * Декор по островам. Остров без записи берёт общий набор — так следующий
 * подключается одной строкой, а не правкой раскладки.
 *
 * Исмара: разграбленный час назад город на виноградниках (islands/01-ismaros.md).
 * Хижина и частокол вдвое выше прочих якорей, поэтому их по одному слоту из
 * восьми — по той же причине, что и ворот. Общие обломки остаются в наборе:
 * по концепции острова колонна, амфора и валун переиспользуются.
 */
const BY_ISLAND: Readonly<Record<string, DecorSet>> = {
  ismaros: {
    anchors: [
      'prop-vine-trellis', 'prop-hut-burnt', 'prop-vine-trellis', 'prop-cart-broken',
      'prop-column-broken', 'prop-palisade-burnt', 'prop-vine-trellis', 'prop-wine-press',
    ],
    satellites: [
      'prop-rubble', 'prop-rock', 'prop-amphora', 'prop-rock-small',
      'prop-rubble', 'prop-column-drum', 'prop-rock', 'prop-rubble',
      'prop-amphora', 'prop-rock-small',
    ],
  },
};

function decorSet(islandId: string): DecorSet {
  return BY_ISLAND[islandId] ?? COMMON;
}

export interface DecorPlacement {
  readonly id: DecorId;
  readonly x: number;
  readonly y: number;
}

/** Одна нитка дороги: стержень или ответвление. Ширина у них разная. */
export interface RoadPath {
  readonly points: readonly { x: number; y: number }[];
  readonly width: number;
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
  /** Все нитки дороги. Первая — стержень, дальше ответвления к боковым зонам. */
  readonly roadPaths: readonly RoadPath[];
  /** Кладка дороги. Считается после стержня и тем же rng — прогон по сиду
   *  остаётся единой воспроизводимой последовательностью. */
  readonly roadStones: readonly RoadStone[];
  /** Пучки травы. Сеются последними — тем же rng, одной цепочкой по сиду. */
  readonly grass: readonly GrassTuft[];
  readonly border: { x: number; y: number; width: number; height: number };

  constructor(rng: Rng, bounds: SceneryBounds, enemies: readonly Enemy[], islandId = '') {
    const layout = islandLayout(islandId);
    // Ландмарки первыми и безусловно: по ним зона и узнаётся, а случайный
    // посев обязан их обтекать, а не наоборот.
    const landmarks = layout ? placeLandmarks(layout, bounds) : [];
    this.props = [
      ...landmarks,
      ...scatterProps(rng, bounds, enemies, decorSet(islandId), landmarks),
    ];
    this.roadPaths = layout ? layoutRoads(layout, bounds) : [randomSpine(rng, bounds)];
    this.roadStones = this.roadPaths.flatMap((path) => roadStones(rng, path.points, path.width));
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
  set: DecorSet,
  landmarks: readonly DecorPlacement[],
): DecorPlacement[] {
  const { scenery } = getBalance();
  const placed: DecorPlacement[] = [];
  // Ландмарки идут в список занятых центров: кластер, севший на давильню,
  // превратил бы ландмарк в кучу мусора.
  const centers: { x: number; y: number }[] = landmarks.map((p) => ({ x: p.x, y: p.y }));
  const budget = Math.max(0, scenery.propCount - landmarks.length);

  for (let cluster = 0; placed.length < budget; cluster++) {
    const center = clusterCenter(rng, bounds, enemies, centers);
    centers.push(center);
    placed.push({ id: set.anchors[cluster % set.anchors.length]!, x: center.x, y: center.y });

    const around: DecorPlacement[] = [];
    for (let i = 0; i < scenery.clusterSatellites; i++) {
      if (placed.length + around.length >= budget) break;
      const id = set.satellites[
        (cluster * scenery.clusterSatellites + i) % set.satellites.length
      ]!;
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
 * Дорога по авторской схеме: стержень от нижнего края к арене и ответвления
 * к боковым зонам.
 *
 * Ответвления и есть разница между «дорогой» и «полосой на траве»: стержень
 * говорит, куда идти дальше по острову, а отвороты — куда свернуть за копиями
 * к конкретному вождю. Одна вертикаль этого сказать не может.
 */
function layoutRoads(layout: IslandLayout, bounds: SceneryBounds): RoadPath[] {
  const { scenery } = getBalance();
  const toPoints = (points: readonly LayoutPoint[]) =>
    points.map((point) => toWorld(point, bounds));

  return [
    { points: toPoints(layout.road), width: scenery.roadWidth },
    ...layout.branches.map((branch) => ({
      points: toPoints(branch),
      width: scenery.roadBranchWidth,
    })),
  ];
}

/** Ландмарки зон в единицах мира, в порядке файла раскладки. */
function placeLandmarks(layout: IslandLayout, bounds: SceneryBounds): DecorPlacement[] {
  const placed: DecorPlacement[] = [];
  for (const zone of layout.zones) {
    for (const landmark of zone.landmarks ?? []) {
      const point = toWorld(landmark.at, bounds);
      placed.push({ id: landmark.prop, x: point.x, y: point.y });
    }
  }
  return placed;
}

/**
 * Ломаная через весь остров, от нижнего края к верхнему, с боковым дрожанием.
 * Запасной путь для островов без раскладки. Именно от края, а не от точки
 * старта: дорога, обрывающаяся под ногами игрока, читается как недорисованная.
 */
function randomSpine(rng: Rng, bounds: SceneryBounds): RoadPath {
  const { scenery } = getBalance();
  const points: { x: number; y: number }[] = [{ x: bounds.startX, y: bounds.height }];

  const segments = Math.max(1, scenery.roadWaypoints - 1);
  const totalRise = bounds.height - bounds.top;
  for (let i = 1; i <= segments; i++) {
    const y = bounds.height - (totalRise * i) / segments;
    const x = bounds.startX + rng.range(-scenery.roadJitter, scenery.roadJitter);
    points.push({ x: clamp(x, 20, bounds.width - 20), y });
  }

  return { points, width: scenery.roadWidth };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
