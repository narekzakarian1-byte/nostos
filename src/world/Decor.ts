import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { Enemy } from './Enemy.ts';
import { toWorld, zoneRect, type IslandLayout } from './Layout.ts';
import type { RoadPath } from './Road.ts';
import { clampRect, clusterCenter, satelliteSpot, type Point } from './Scatter.ts';

/** Совпадает с ключами balance.props.sizes и таблицей картинок ui/AssetTable.ts
 *  — типы не импортируются оттуда, чтобы world/ не тянул зависимость на ui/
 *  (CLAUDE.md: слои разделены). Чем проп нарисован — геометрией или картинкой —
 *  world/ не знает и знать не должен: здесь только раскладка по земле. */
export type DecorId =
  // Растительность — вертикаль кадра.
  | 'prop-cypress' | 'prop-pine' | 'prop-olive' | 'prop-shrub' | 'prop-reeds' | 'prop-vines'
  // Камень.
  | 'prop-rock' | 'prop-rock-small' | 'prop-slabs' | 'prop-crag' | 'prop-cave'
  // Обжитое.
  | 'prop-hut' | 'prop-hut-burnt' | 'prop-palisade' | 'prop-cart' | 'prop-crates'
  | 'prop-campfire' | 'prop-amphora' | 'prop-press' | 'prop-shards'
  // Обработанный камень.
  | 'prop-column' | 'prop-column-broken' | 'prop-drum' | 'prop-altar' | 'prop-stele' | 'prop-gate'
  // Ландмарки.
  | 'prop-temple' | 'prop-ship';

export interface DecorPlacement {
  readonly id: DecorId;
  readonly x: number;
  readonly y: number;
  /**
   * Размер относительно базового и зеркало по горизонтали.
   *
   * Без них один и тот же камень отпечатывался два десятка раз без единого
   * отличия, и глаз ловил повтор раньше, чем успевал прочитать сцену. Ровно
   * это и читается как «понатыканы объекты»: не то, что предметов много, а
   * то, что они одинаковые.
   *
   * Масштаб идёт и в след на земле (Blockers.blockersOf), и в габарит для
   * отсечения (ui/props/Prop.propBox) — иначе выросший камень пускал бы
   * игрока сквозь себя.
   */
  readonly scale: number;
  readonly flip: boolean;
}

/** Разброс размера и зеркало для сеяного пропа. Бросается перед выбором места:
 *  зазор до дороги и до узлов считается уже по выросшему следу. */
export function varyProp(rng: Rng): { scale: number; flip: boolean } {
  const { propScaleJitter, propFlipChance } = getBalance().scenery;
  return {
    scale: 1 + rng.range(-propScaleJitter, propScaleJitter),
    flip: rng.chance(propFlipChance),
  };
}

export interface DecorBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
}

interface DecorSet {
  /** Крупное, вокруг чего собирается группа. */
  readonly anchors: readonly DecorId[];
  /** Мелочь вокруг якоря. */
  readonly satellites: readonly DecorId[];
}

// Запасной набор для острова без раскладки. Крупного в якорях мало и оно
// невысокое: объект выше игрока перекрывает его собой, и остров из таких
// превращается в частокол, сквозь который не видно врагов.
//
// Основная масса — ПЛОСКОЕ: плиты, черепки, галька. Они лежат на земле, следа
// не имеют и набирают плотность картинки, ничего не загораживая. Именно так
// плотность набрана в референсе: немного крупного и много лежачего, а не
// сорок стоящих предметов на экран.
const COMMON: DecorSet = {
  anchors: [
    'prop-rock', 'prop-shrub', 'prop-column-broken', 'prop-olive',
    'prop-rock', 'prop-shrub', 'prop-crates', 'prop-cart',
  ],
  satellites: [
    'prop-slabs', 'prop-rock-small', 'prop-shards', 'prop-slabs',
    'prop-amphora', 'prop-rock-small', 'prop-drum', 'prop-slabs',
  ],
};

/**
 * Ландмарки зон в единицах мира, в порядке файла раскладки. Ставятся первыми и
 * безусловно: по ним зона и узнаётся, а случайный посев обязан их обтекать.
 */
export function placeLandmarks(layout: IslandLayout, bounds: DecorBounds): DecorPlacement[] {
  const placed: DecorPlacement[] = [];
  // Доля мира по вертикали переводится в единицы не сама по себе: сверху
  // мир срезан на HUD и отбивку (bounds.top), а высота мира зависит от окна.
  // На низком окне верхняя зона сжимается, и ландмарк с долей 0.075 уезжает
  // за стену — храм повисал над чёрным полем. Клампим в ту же землю, по
  // которой ходит игрок.
  const land = clampRect({ x: 0, y: 0, width: bounds.width, height: bounds.height }, bounds);
  for (const zone of layout.zones) {
    for (const landmark of zone.landmarks ?? []) {
      const point = toWorld(landmark.at, bounds);
      // Ландмарк не варьируется: его ставит рука, и храм в зеркале читается
      // ошибкой, а не разнообразием.
      placed.push({
        id: landmark.prop,
        x: Math.min(Math.max(point.x, land.x), land.x + land.width),
        y: Math.min(Math.max(point.y, land.y), land.y + land.height),
        scale: 1,
        flip: false,
      });
    }
  }
  return placed;
}

/**
 * Декор по зонам: у каждой свой набор и своя плотность.
 *
 * Это и есть разница между продуманным островом и засеянным. Общий набор на
 * весь остров давал винный пресс на площади храма и шпалеру посреди дороги —
 * предметы переставали означать место и становились обоями. Здесь на террасах
 * растут шпалеры, в деревне лежит пепелище, а на учебном берегу почти пусто,
 * потому что вокруг врагов там должно быть чистое поле.
 */
export function scatterByZones(
  rng: Rng,
  bounds: DecorBounds,
  enemies: readonly Enemy[],
  layout: IslandLayout,
  roads: readonly RoadPath[],
  landmarks: readonly DecorPlacement[],
): DecorPlacement[] {
  const { scenery } = getBalance();
  const placed: DecorPlacement[] = [];
  const centers: Point[] = landmarks.map((p) => ({ x: p.x, y: p.y }));

  for (const zone of layout.zones) {
    const set = zone.props;
    if (!set) continue;
    const area = clampRect(zoneRect(zone, bounds), bounds);

    for (let cluster = 0; cluster < set.clusters; cluster++) {
      const anchor = set.anchors[cluster % set.anchors.length]!;
      const anchorVary = varyProp(rng);
      const center = clusterCenter(rng, area, enemies, centers, roads, anchor, anchorVary.scale);
      centers.push(center);
      placed.push({ id: anchor, x: center.x, y: center.y, ...anchorVary });

      const around: DecorPlacement[] = [];
      for (let i = 0; i < scenery.clusterSatellites; i++) {
        const id = set.satellites[
          (cluster * scenery.clusterSatellites + i) % set.satellites.length
        ]!;
        const vary = varyProp(rng);
        around.push({
          id,
          ...vary,
          ...satelliteSpot(rng, area, center, around, roads, id, enemies, vary.scale),
        });
      }
      placed.push(...around);
    }
  }

  return placed;
}

/** Прежний посев по всему острову. Держится для островов без раскладки. */
export function scatterProps(
  rng: Rng,
  bounds: DecorBounds,
  enemies: readonly Enemy[],
  roads: readonly RoadPath[],
): DecorPlacement[] {
  const { scenery } = getBalance();
  const set = COMMON;
  const placed: DecorPlacement[] = [];
  const centers: Point[] = [];
  const area = clampRect({ x: 0, y: 0, width: bounds.width, height: bounds.height }, bounds);

  for (let cluster = 0; placed.length < scenery.propCount; cluster++) {
    const anchor = set.anchors[cluster % set.anchors.length]!;
    const anchorVary = varyProp(rng);
    const center = clusterCenter(rng, area, enemies, centers, roads, anchor, anchorVary.scale);
    centers.push(center);
    placed.push({ id: anchor, x: center.x, y: center.y, ...anchorVary });

    const around: DecorPlacement[] = [];
    for (let i = 0; i < scenery.clusterSatellites; i++) {
      if (placed.length + around.length >= scenery.propCount) break;
      const id = set.satellites[
        (cluster * scenery.clusterSatellites + i) % set.satellites.length
      ]!;
      const vary = varyProp(rng);
      around.push({
        id,
        ...vary,
        ...satelliteSpot(rng, area, center, around, roads, id, enemies, vary.scale),
      });
    }
    placed.push(...around);
  }

  return placed;
}

