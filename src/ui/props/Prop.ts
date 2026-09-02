import type { DecorId } from '../../world/Scenery.ts';
import { drawPropSolid, propMetrics } from './Bake.ts';
import { drawPicture, isPictureProp, pictureBox } from './Pictures.ts';

/**
 * Единственная дверь к пропам для остального рендера. За ней два разных пути:
 * геометрия (Bake.ts) и картинка острова (Pictures.ts).
 *
 * Отдельным модулем, а не развилкой в двух местах, потому что вызывающих ровно
 * два — Terrain.ts рисует, WorldLayer.ts отсекает невидимое, — и разъехаться
 * они не должны: проп, посчитанный габаритом одного пути и нарисованный
 * другим, пропадал бы с экрана на подходе к нему.
 */
export interface PropBox {
  readonly width: number;
  readonly height: number;
}

/** Габарит пропа в единицах мира. Без канваса — доступен и в тестах. */
export function propBox(id: DecorId): PropBox {
  if (isPictureProp(id)) return pictureBox(id);
  const m = propMetrics(id);
  return { width: m.width, height: m.height };
}

/** Проп на экран. x, y — точка касания земли, одинаково для обоих путей. */
export function paintProp(
  ctx: CanvasRenderingContext2D,
  id: DecorId,
  x: number,
  y: number,
): void {
  if (isPictureProp(id)) drawPicture(ctx, id, x, y);
  else drawPropSolid(ctx, id, x, y);
}
