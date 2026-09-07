import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

/**
 * Камни мощения дороги. Данные, а не рисование: раскладка детерминирована
 * сидом (CLAUDE.md §2), поэтому дорога одинакова во всех прогонах и её можно
 * проверить тестом, не имея канваса.
 *
 * Плоская заливка на четверть экрана читается как дыра в текстуре — в
 * референсе дорога всегда мощёная, с отдельными камнями и тёмным краем.
 */
export interface RoadStone {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly angle: number;
  /** 0 — светлый камень, 1 — тёмный. Чередование и даёт кладку. */
  readonly tone: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Одна нитка дороги: стержень или ответвление. Ширина у них разная. */
export interface RoadPath {
  readonly points: readonly Point[];
  readonly width: number;
}

/**
 * Расстояние от точки до ломаной. Нужно раскладке декора: проп, севший на
 * дорогу, читается как ошибка, а не как разорённая деревня.
 */
export function distanceToPaths(points: readonly Point[], x: number, y: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length - 1; i++) {
    best = Math.min(best, distanceToSegment(points[i]!, points[i + 1]!, x, y));
  }
  return best;
}

function distanceToSegment(a: Point, b: Point, x: number, y: number): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  // Вырожденный отрезок: обе точки совпали, считаем расстояние до точки.
  if (lengthSq === 0) return Math.hypot(x - a.x, y - a.y);
  const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSq));
  return Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t));
}

/**
 * Сглаживание ломаной срезанием углов (Чайкин).
 *
 * Дорога задана десятком точек, и по ним она шла ломаной с изломами на каждой:
 * на карте это читалось не дорогой, а схемой — прямой ствол с отростками под
 * прямым углом, рыбья кость. Кривая говорит, что дорогу протоптали по земле, а
 * не провели по линейке.
 *
 * Концы держатся на месте намеренно: стержень обязан упираться в нижний край
 * мира и в арену, а ответвление — в свой ландмарк. Сдвинь их сглаживание, и
 * дорога начнётся в поле, не дойдя до берега.
 */
export function smoothPath(points: readonly Point[], passes: number): Point[] {
  let current = [...points];
  for (let pass = 0; pass < passes && current.length >= 3; pass++) {
    const next: Point[] = [current[0]!];
    for (let i = 0; i < current.length - 1; i++) {
      const a = current[i]!;
      const b = current[i + 1]!;
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    next.push(current[current.length - 1]!);
    current = next;
  }
  return current;
}

/**
 * Ближайшая точка ломаной. Нужна развилке: ответвление начинается в вершине
 * стержня, а сглаживание вершину сдвигает — без пересадки на сглаженный
 * стержень отворот повисал бы в стороне от дороги, из которой выходит.
 */
export function nearestOnPath(points: readonly Point[], x: number, y: number): Point {
  let best = points[0] ?? { x, y };
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSq));
    const point = { x: a.x + dx * t, y: a.y + dy * t };
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = point;
    }
  }
  return best;
}

/** Ширина приходит снаружи: у стержня и у ответвления она разная, а кладка
 *  обязана лежать в своих берегах — иначе камни висят на траве. */
export function roadStones(rng: Rng, points: readonly Point[], width: number): RoadStone[] {
  const { scenery } = getBalance();
  const stones: RoadStone[] = [];
  if (points.length < 2) return stones;

  const halfSpan = width / 2 - scenery.roadStoneInset;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length <= 0) continue;
    const dirX = (b.x - a.x) / length;
    const dirY = (b.y - a.y) / length;

    for (let along = 0; along < length; along += scenery.roadStoneStep) {
      for (let k = 0; k < scenery.roadStonesPerStep; k++) {
        const t = along + rng.range(0, scenery.roadStoneStep);
        const across = rng.range(-halfSpan, halfSpan);
        const jitter = 1 + rng.range(-scenery.roadStoneSizeJitter, scenery.roadStoneSizeJitter);
        stones.push({
          // Поперёк — нормаль к направлению отрезка.
          x: a.x + dirX * t - dirY * across,
          y: a.y + dirY * t + dirX * across,
          size: scenery.roadStoneSize * jitter,
          angle: rng.range(0, Math.PI),
          tone: rng.chance(0.5) ? 0 : 1,
        });
      }
    }
  }
  return stones;
}
