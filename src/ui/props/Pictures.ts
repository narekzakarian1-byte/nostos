import { getBalance } from '../../core/Balance.ts';
import type { SpriteId } from '../AssetManifest.ts';
import { sprites } from '../Sprites.ts';

/**
 * Пропы. Каждый — готовый PNG из Blender, поставленный подошвой на землю, плюс
 * парный файл отброшенной тени.
 *
 * Раньше здесь было два пути: рендер с настоящей тенью и старая картинка из
 * Draw Things, которой движок тень нарисовать не мог и подкладывал под неё
 * пятно. Второго пути больше нет — весь арт идёт из фабрики, — и вместе с ним
 * ушла развилка, из-за которой соседние объекты жили под разным светом.
 *
 * Тень рисуется ОТДЕЛЬНЫМ файлом, а не пятном под подошвой, и это половина
 * эффекта: без неё объект висит над травой при любом качестве самого объекта.
 * Её форма — проекция силуэта под тем же солнцем, что у всех остальных, и
 * именно поэтому три десятка предметов на экране читаются одной сценой.
 */
export type PicturePropId = string;

interface Rendered {
  readonly anchorX: number;
  readonly anchorY: number;
  readonly boxW: number;
  readonly boxH: number;
}

function rendered(id: string): Rendered | undefined {
  return getBalance().props.rendered?.[id];
}

export function isPictureProp(id: string): id is PicturePropId {
  return rendered(id) !== undefined;
}

export interface PictureBox {
  readonly width: number;
  readonly height: number;
}

/**
 * Габарит картинки в единицах мира — вместе с тенью. Считается из модели при
 * рендере, а не выводится из пропорции файла, поэтому известен и без DOM: по
 * нему WorldLayer отсекает невидимое, и это проверяется тестом.
 */
export function pictureBox(id: PicturePropId): PictureBox {
  const size = getBalance().props.sizes[id];
  const meta = rendered(id);
  if (!size || !meta) return { width: 0, height: 0 };
  return { width: size.value * meta.boxW, height: size.value * meta.boxH };
}

/** Проп на экран. x, y — точка КАСАНИЯ земли. */
export function drawPicture(
  ctx: CanvasRenderingContext2D,
  id: PicturePropId,
  x: number,
  y: number,
): void {
  const meta = rendered(id);
  if (!meta) return;
  const box = pictureBox(id);
  // Якорь — точка касания земли внутри картинки, посчитанная из модели.
  // Соглашение «подошва на нижней кромке» с настоящей тенью не работает: тень
  // уходит влево-вниз и выносит габарит далеко за подошву.
  const left = x - meta.anchorX * box.width;
  const top = y - meta.anchorY * box.height;
  // Тень кладётся умножением: она запечена нейтральным тёмным, и на гальке,
  // плите и пепелище обязана темнить свою поверхность, а не красить её в
  // один цвет (balance.props._shadowMeasureNote).
  const shadow = sprites.get(`${id}-shadow` as SpriteId);
  if (shadow) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(shadow, left, top, box.width, box.height);
    ctx.restore();
  }
  const body = sprites.get(id as SpriteId);
  if (body) ctx.drawImage(body, left, top, box.width, box.height);
}
