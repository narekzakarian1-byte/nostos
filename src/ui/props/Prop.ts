import type { DecorPlacement } from '../../world/Scenery.ts';
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

/**
 * Габарит пропа в единицах мира. Без канваса — доступен и в тестах.
 *
 * Берёт размещение, а не один id: у каждого экземпляра свой размер
 * (DecorPlacement.scale), и отсечение по невидимости обязано считать по нему —
 * иначе выросший проп пропадал бы с экрана раньше, чем уйдёт за край.
 */
export function propBox(prop: DecorPlacement): PropBox {
  const base = isPictureProp(prop.id)
    ? pictureBox(prop.id)
    : (() => {
        const m = propMetrics(prop.id);
        return { width: m.width, height: m.height };
      })();
  return { width: base.width * prop.scale, height: base.height * prop.scale };
}

/**
 * Проп на экран. x, y — точка касания земли, одинаково для обоих путей.
 *
 * Зеркало и размер применяются здесь, а не внутри каждого пути: отражение — это
 * та же матрица для картинки и для запечённой геометрии, и разъехаться они не
 * должны.
 */
export function paintProp(ctx: CanvasRenderingContext2D, prop: DecorPlacement): void {
  const plain = prop.scale === 1 && !prop.flip;
  if (plain) {
    paintAt(ctx, prop, prop.x, prop.y);
    return;
  }

  ctx.save();
  // Начало координат — в точке касания: масштаб и зеркало не должны сдвигать
  // подошву, иначе проп отъезжает от собственной тени.
  ctx.translate(prop.x, prop.y);
  ctx.scale(prop.flip ? -prop.scale : prop.scale, prop.scale);
  paintAt(ctx, prop, 0, 0);
  ctx.restore();
}

function paintAt(
  ctx: CanvasRenderingContext2D,
  prop: DecorPlacement,
  x: number,
  y: number,
): void {
  if (isPictureProp(prop.id)) drawPicture(ctx, prop.id, x, y);
  else drawPropSolid(ctx, prop.id, x, y);
}
