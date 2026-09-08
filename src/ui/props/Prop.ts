import type { DecorPlacement } from '../../world/Scenery.ts';
import { drawPicture, pictureBox } from './Pictures.ts';

/**
 * Единственная дверь к пропам для остального рендера.
 *
 * Раньше за ней было две дороги — геометрия движка и картинка острова, — и
 * половина модуля следила, чтобы вызывающие не разошлись в выборе. Дорога
 * осталась одна: любой проп это готовый PNG из фабрики вместе со своей тенью.
 *
 * Модуль тем не менее не схлопнут в вызов Pictures напрямую: вызывающих двое —
 * Terrain.ts рисует, WorldLayer.ts отсекает невидимое, — и габарит, по
 * которому считается отсечение, обязан быть тем же, по которому идёт
 * отрисовка. Проп, посчитанный одним и нарисованный другим, пропадал бы с
 * экрана на подходе к нему.
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
  const base = pictureBox(prop.id);
  return { width: base.width * prop.scale, height: base.height * prop.scale };
}

/**
 * Проп на экран. x, y — точка касания земли.
 *
 * Зеркало и размер применяются здесь, а не внутри Pictures: начало координат
 * ставится в точку касания, иначе масштабирование уводит подошву, и проп
 * отъезжает от собственной тени.
 */
export function paintProp(ctx: CanvasRenderingContext2D, prop: DecorPlacement): void {
  if (prop.scale === 1 && !prop.flip) {
    drawPicture(ctx, prop.id, prop.x, prop.y);
    return;
  }
  ctx.save();
  ctx.translate(prop.x, prop.y);
  ctx.scale(prop.flip ? -prop.scale : prop.scale, prop.scale);
  drawPicture(ctx, prop.id, 0, 0);
  ctx.restore();
}
