import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import type { Enemy } from './Enemy.ts';
import { toWorld, zoneRect, type IslandLayout } from './Layout.ts';
import type { RoadPath } from './Road.ts';
import { clampRect, clusterCenter, satelliteSpot, type Point } from './Scatter.ts';

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

export interface DecorPlacement {
  readonly id: DecorId;
  readonly x: number;
  readonly y: number;
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
 * Ландмарки зон в единицах мира, в порядке файла раскладки. Ставятся первыми и
 * безусловно: по ним зона и узнаётся, а случайный посев обязан их обтекать.
 */
export function placeLandmarks(layout: IslandLayout, bounds: DecorBounds): DecorPlacement[] {
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
      const center = clusterCenter(rng, area, enemies, centers, roads);
      centers.push(center);
      placed.push({ id: set.anchors[cluster % set.anchors.length]!, x: center.x, y: center.y });

      const around: DecorPlacement[] = [];
      for (let i = 0; i < scenery.clusterSatellites; i++) {
        const id = set.satellites[
          (cluster * scenery.clusterSatellites + i) % set.satellites.length
        ]!;
        around.push({ id, ...satelliteSpot(rng, area, center, around, roads) });
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
    const center = clusterCenter(rng, area, enemies, centers, roads);
    centers.push(center);
    placed.push({ id: set.anchors[cluster % set.anchors.length]!, x: center.x, y: center.y });

    const around: DecorPlacement[] = [];
    for (let i = 0; i < scenery.clusterSatellites; i++) {
      if (placed.length + around.length >= scenery.propCount) break;
      const id = set.satellites[
        (cluster * scenery.clusterSatellites + i) % set.satellites.length
      ]!;
      around.push({ id, ...satelliteSpot(rng, area, center, around, roads) });
    }
    placed.push(...around);
  }

  return placed;
}

