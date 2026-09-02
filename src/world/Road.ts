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
