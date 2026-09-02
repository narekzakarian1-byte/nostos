import { getBalance } from '../core/Balance.ts';
import type { Rng } from '../core/Rng.ts';

/**
 * Пучки травы по всему острову. Данные, детерминированные сидом; рисует их
 * ui/Terrain.ts.
 *
 * Земля в референсе не однотонная: её оживляет именно мелочь — короткие яркие
 * пучки, которых много. Без них большая заливка одного зелёного читается как
 * незаполненный фон, сколько ни правь его тон.
 */
export interface GrassTuft {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Наклон пучка, радианы: одинаково стоящая трава выдаёт штамп. */
  readonly lean: number;
}

export interface GrassBounds {
  readonly width: number;
  readonly height: number;
  readonly top: number;
}

export function grassTufts(rng: Rng, bounds: GrassBounds): GrassTuft[] {
  const { scenery } = getBalance();
  const tufts: GrassTuft[] = [];
  for (let i = 0; i < scenery.grassCount; i++) {
    tufts.push({
      x: rng.range(0, bounds.width),
      y: rng.range(bounds.top, bounds.height),
      size: scenery.grassSize * (1 + rng.range(-scenery.grassSizeJitter, scenery.grassSizeJitter)),
      lean: rng.range(-scenery.grassLean, scenery.grassLean),
    });
  }
  return tufts;
}
