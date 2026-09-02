import type { BodyAnim } from '../juice/BodyAnim.ts';
import { getBalance } from '../core/Balance.ts';
import type { SpriteId } from './AssetManifest.ts';
import { sprites } from './Sprites.ts';
import { drawRig, rigReady, type RigDraw } from './rig/DrawRig.ts';
import { groundShadow, panel, ui } from './UiKit.ts';

/**
 * Одна фигура на земле со всеми её смещениями: выпад, отдача, покачивание при
 * ходьбе, сжатие от удара, распад при смерти, вспышка попадания.
 *
 * Общая и для игрока, и для врага намеренно: две отдельные реализации разъехались
 * бы по ощущению, и удар игрока стал бы весить не столько же, сколько ответный.
 */
export interface BodyDraw {
  /** Точка на земле, вокруг которой всё считается. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** +1 вправо, -1 влево. */
  readonly facing: number;
  readonly sprite: SpriteId | undefined;
  /** Цвет прямоугольника, если спрайта нет. */
  readonly fallback: string;
  readonly anim: BodyAnim;
  /** Смещение выпада в единицах мира. */
  readonly pushX: number;
  readonly pushY: number;
  /** Наклон корпуса, радианы. */
  readonly tilt: number;
  /** Покачивание при ходьбе, вверх-вниз. */
  readonly bob: number;
  /**
   * Собранная из частей фигура вместо цельной картинки. Пока деталей нет,
   * поле пустое и рисуется прежний спрайт — арт добавляется без правок кода.
   */
  readonly rig?: Omit<RigDraw, 'size' | 'tint'>;
}

export function drawBody(ctx: CanvasRenderingContext2D, body: BodyDraw): void {
  const anim = body.anim;
  const alpha = anim.alpha;
  if (alpha <= 0) return;

  const groundX = body.x + anim.offsetX + body.pushX;
  const centerY = body.y + anim.offsetY + body.pushY + body.bob;
  // Тень остаётся на земле: она не поднимается вместе с фигурой на подскоке и
  // не уезжает вверх при распаде — иначе труп «улетает» вместе со своим пятном.
  groundShadow(ctx, groundX, body.y + body.size / 2, body.size, alpha);

  const img = body.sprite ? sprites.get(body.sprite) : undefined;
  const half = body.size / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(groundX, centerY);
  ctx.rotate(body.tilt + anim.rotation);
  // Отражение после поворота: иначе наклон корпуса зеркалится вместе с фигурой
  // и враг на обратном ходе маршрута заваливается не в ту сторону.
  if (body.facing < 0) ctx.scale(-1, 1);
  ctx.scale(anim.scaleX, anim.scaleY);

  const rig = usableRig(body);
  if (rig) {
    drawRig(ctx, { ...rig, size: body.size });
  } else if (img) {
    drawSprite(ctx, img, body.size, half);
  } else {
    panel(ctx, -half, -half, body.size, body.size, { fill: body.fallback });
  }
  drawFlash(ctx, body, img, half);
  ctx.restore();
}

/**
 * Белая вспышка по силуэту фигуры. Именно по силуэту, а не прямоугольником:
 * прямоугольник читается как чужой объект поверх врага, а не как его подсветка.
 */
function drawFlash(
  ctx: CanvasRenderingContext2D,
  body: BodyDraw,
  img: HTMLImageElement | undefined,
  half: number,
): void {
  const flash = body.anim.flash;
  if (flash <= 0) return;

  const { flashAlpha } = getBalance().anim;
  const color = ui().colors.text;
  ctx.globalAlpha = ctx.globalAlpha * flashAlpha * flash;

  const rig = usableRig(body);
  if (rig) {
    drawRig(ctx, { ...rig, size: body.size, tint: color });
    return;
  }

  const stamp = body.sprite && img ? sprites.silhouette(body.sprite, color) : undefined;
  if (stamp) {
    drawSprite(ctx, stamp, body.size, half);
    return;
  }
  ctx.fillStyle = color;
  ctx.fillRect(-half, -half, body.size, body.size);
}

/**
 * Картинка фигуры: высота равна размеру тира, ширина — по пропорции файла.
 * Не квадратом: фигуры островов рисуются в портретном кадре, и растянутый до
 * квадрата кикон становится вдвое шире себя. Подошва при этом остаётся на месте
 * — низ картинки совпадает с низом прежнего квадрата, а по нему считается и
 * глубина в WorldLayer, и тень.
 */
function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource & { width: number; height: number },
  size: number,
  half: number,
): void {
  const width = size * (img.width / img.height);
  ctx.drawImage(img, -width / 2, -half, width, size);
}

/** Риг годится, только если загружены все детали: полфигуры хуже прямоугольника. */
function usableRig(body: BodyDraw): Omit<RigDraw, 'size' | 'tint'> | undefined {
  return body.rig && rigReady() ? body.rig : undefined;
}
