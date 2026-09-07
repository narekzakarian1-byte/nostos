import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';
import { placeLandmarks, scatterByZones, scatterProps } from './Decor.ts';
import type { DecorPlacement } from './Decor.ts';
import type { Enemy } from './Enemy.ts';
import { grassTufts, type GrassTuft } from './Grass.ts';
import { Ground } from './Ground.ts';
import { islandLayout, toWorld, type IslandLayout, type LayoutPoint } from './Layout.ts';
import {
  nearestOnPath, roadStones, smoothPath, type RoadPath, type RoadStone,
} from './Road.ts';

// Раскладка декора живёт в Decor.ts, дорога — в Road.ts. Здесь сборка: что
// в каком порядке считается и на чём стоит. Типы декора переэкспортируются,
// потому что на них завязан весь рендер пропов.
export type { DecorId, DecorPlacement } from './Decor.ts';
export type { RoadPath } from './Road.ts';

/**
 * Прямоугольник суши: та часть мира, по которой можно ходить. Считается в
 * одном месте, потому что по нему живут двое — стена по краю острова и
 * ограничение движения игрока. Разъедься они, игрок оказался бы стоящим
 * снаружи собственного острова, на чёрном поле за стеной.
 */
export function borderRect(bounds: SceneryBounds): {
  x: number; y: number; width: number; height: number;
} {
  const { borderInset } = getBalance().scenery;
  return {
    x: borderInset,
    y: bounds.top + borderInset,
    width: bounds.width - borderInset * 2,
    height: bounds.height - bounds.top - borderInset * 2,
  };
}

export interface SceneryBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly startX: number;
  readonly startY: number;
}

/**
 * Обстановка острова: декор, дорога, граница. Никакого канваса — только данные,
 * детерминированные по сиду (CLAUDE.md §2). Рисует Renderer.ts.
 *
 * Порядок в конструкторе — не случайность. Дорога считается раньше декора,
 * потому что декор обязан её обтекать; ландмарки раньше посева, потому что
 * посев обтекает уже их. Обратный порядок и давал телегу поперёк тракта.
 */
export class Scenery {
  readonly props: readonly DecorPlacement[];
  /** Все нитки дороги. Первая — стержень, дальше ответвления к боковым зонам. */
  readonly roadPaths: readonly RoadPath[];
  /** Кладка дороги. Считается после ниток и тем же rng — прогон по сиду
   *  остаётся единой воспроизводимой последовательностью. */
  readonly roadStones: readonly RoadStone[];
  /** Пучки травы. Сеются последними — тем же rng, одной цепочкой по сиду. */
  readonly grass: readonly GrassTuft[];
  readonly border: { x: number; y: number; width: number; height: number };
  /** Земля: берег, материалы зон, пятна света. Печёт её ui/GroundPaint.ts. */
  readonly ground: Ground;

  constructor(rng: Rng, bounds: SceneryBounds, enemies: readonly Enemy[], islandId = '') {
    const layout = islandLayout(islandId);

    this.roadPaths = layout ? layoutRoads(layout, bounds) : [randomSpine(rng, bounds)];
    this.roadStones = this.roadPaths.flatMap((path) => roadStones(rng, path.points, path.width));

    if (layout) {
      const landmarks = placeLandmarks(layout, bounds);
      this.props = [
        ...landmarks,
        ...scatterByZones(rng, bounds, enemies, layout, this.roadPaths, landmarks),
      ];
    } else {
      this.props = scatterProps(rng, bounds, enemies, this.roadPaths);
    }

    // Трава сеется после дороги и знает раскладку: пучок, севший на кладку
    // или на галечный берег, — тот же признак засеянного мира, что и телега
    // поперёк тракта.
    this.grass = grassTufts(rng, bounds, this.roadPaths, layout);
    this.border = borderRect(bounds);
    // Земля считается последней: берег обходит уже посчитанную стену.
    this.ground = new Ground(rng, bounds, this.border, layout);
  }
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

  // Ломаная по точкам файла шла с изломом на каждой вершине, и на карте это
  // читалось схемой, а не дорогой. Сглаживание — здесь, а не в файле: иначе
  // раскладку пришлось бы вести сотней точек вместо десятка.
  const spine = smoothPath(toPoints(layout.road), scenery.roadSmoothPasses);

  return [
    { points: spine, width: scenery.roadWidth },
    ...layout.branches.map((branch) => {
      const points = toPoints(branch);
      // Первая точка отворота садится на СГЛАЖЕННЫЙ стержень: сглаживание
      // сдвигает вершины, и без пересадки развилка отрывается от дороги.
      const head = points[0];
      if (head) points[0] = nearestOnPath(spine, head.x, head.y);
      return {
        points: smoothPath(points, scenery.roadSmoothPasses),
        width: scenery.roadBranchWidth,
      };
    }),
  ];
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
    points.push({ x: Math.min(bounds.width - 20, Math.max(20, x)), y });
  }

  return { points, width: scenery.roadWidth };
}
