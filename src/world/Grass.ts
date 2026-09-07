import { getBalance } from '../core/Balance.ts';
import type { TerrainId } from '../core/BalanceTypes.ts';
import type { Rng } from '../core/Rng.ts';
import { zoneAt, type IslandLayout } from './Layout.ts';
import { distanceToPaths, type RoadPath } from './Road.ts';

/**
 * Пучки травы по острову. Данные, детерминированные сидом; рисует их
 * ui/Terrain.ts.
 *
 * Их было девятьсот на мир — около сотни на экран, вчетверо больше, чем
 * объектов на кадре референса. Такая плотность читается не травой, а конфетти:
 * глаз ловит повтор одной и той же галочки раньше, чем успевает увидеть землю.
 * Плотность картинки теперь набирает сама земля (world/Ground.ts), а трава
 * только оживляет её на просвет.
 *
 * И растёт она не везде. Пучок на мощёной площади или на галечном берегу —
 * ровно тот случай, когда предмет перестаёт что-либо означать: земля под ним
 * говорит одно, а он другое.
 */
export interface GrassTuft {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Наклон пучка, радианы: одинаково стоящая трава выдаёт штамп. */
  readonly lean: number;
  /** Сухой пучок рисуется другим тоном: сплошная зелень читается заливкой. */
  readonly dry: boolean;
}

export interface GrassBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
}

export function grassTufts(
  rng: Rng,
  bounds: GrassBounds,
  roads: readonly RoadPath[],
  layout: IslandLayout | null,
): GrassTuft[] {
  const { scenery } = getBalance();
  const tufts: GrassTuft[] = [];

  // Бросков всегда grassCount: часть отсеется землёй под ногами, и густота
  // сама пойдёт по материалу — сплошная на лугу, редкая на плите площади.
  // Число бросков постоянно намеренно, иначе прогон по сиду разъезжался бы от
  // одной правки tuftChance.
  for (let i = 0; i < scenery.grassCount; i++) {
    const x = rng.range(0, bounds.width);
    const y = rng.range(bounds.top, bounds.height);
    const size = scenery.grassSize
      * (1 + rng.range(-scenery.grassSizeJitter, scenery.grassSizeJitter));
    const lean = rng.range(-scenery.grassLean, scenery.grassLean);
    const dry = rng.chance(0.35);
    const roll = rng.chance(chanceAt(layout, bounds, x, y));

    if (!roll) continue;
    if (onRoad(roads, x, y)) continue;
    tufts.push({ x, y, size, lean, dry });
  }
  return tufts;
}

/** Как охотно трава растёт на земле этой зоны. Зоны нет — общая трава острова. */
function chanceAt(
  layout: IslandLayout | null,
  bounds: GrassBounds,
  x: number,
  y: number,
): number {
  const { tuftChance } = getBalance().terrain;
  if (!layout) return tuftChance.grass;
  const zone = zoneAt(layout, bounds, x, y);
  const ground: TerrainId = zone?.ground ?? 'grass';
  return tuftChance[ground];
}

/** Пучок, севший на кладку, — тот же признак засеянного мира, что и телега
 *  поперёк тракта. Полоса свободы та же, что у декора (Scatter.onRoad). */
function onRoad(roads: readonly RoadPath[], x: number, y: number): boolean {
  const { roadClearance } = getBalance().scenery;
  for (const path of roads) {
    if (distanceToPaths(path.points, x, y) < path.width / 2 + roadClearance) return true;
  }
  return false;
}
