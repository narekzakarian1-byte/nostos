import { getBalance } from '../../core/Balance.ts';
import { SPRITES, type SpriteId } from '../AssetManifest.ts';
import { sprites } from '../Sprites.ts';

/**
 * Пропы-картинки. В отличие от геометрических (Models.ts) у них нет ни модели,
 * ни запекания: это готовый PNG, который ставится подошвой на землю.
 *
 * Такие пропы приходят пачкой на остров, под общий промпт (ISLANDS.md §1.4),
 * поэтому ракурс и свет внутри острова сходятся сами. Тень движок им НЕ рисует:
 * у сгенерированных картинок она своя, внутри PNG, и вторая легла бы поверх.
 *
 * Тип собирается через Extract из SpriteId, а не отдельным списком строк: так
 * пропа, которого нет в манифесте, не существует и на уровне типа —
 * промахнуться именем нельзя.
 */
export type PicturePropId = Extract<
  SpriteId,
  'prop-vine-trellis' | 'prop-wine-press' | 'prop-cart-broken'
  | 'prop-palisade-burnt' | 'prop-hut-burnt'
>;

const PICTURE_PROPS: readonly PicturePropId[] = [
  'prop-vine-trellis', 'prop-wine-press', 'prop-cart-broken',
  'prop-palisade-burnt', 'prop-hut-burnt',
];

export function isPictureProp(id: string): id is PicturePropId {
  return (PICTURE_PROPS as readonly string[]).includes(id);
}

export interface PictureBox {
  readonly width: number;
  readonly height: number;
}

/**
 * Габарит пропа в единицах мира. Одна сторона задана в props.sizes, вторая
 * считается из пропорции файла — она берётся из манифеста, а не из загруженной
 * картинки, чтобы габарит был известен и без DOM: по нему WorldLayer отсекает
 * невидимое, и это проверяется тестом.
 */
export function pictureBox(id: PicturePropId): PictureBox {
  const size = getBalance().props.sizes[id];
  const def = SPRITES[id];
  const aspect = def.width / def.height;
  return size.fit === 'width'
    ? { width: size.value, height: size.value / aspect }
    : { width: size.value * aspect, height: size.value };
}

/** Проп на экран. x, y — точка КАСАНИЯ земли, как и у геометрических пропов. */
export function drawPicture(
  ctx: CanvasRenderingContext2D,
  id: PicturePropId,
  x: number,
  y: number,
): void {
  const img = sprites.get(id);
  if (!img) return;
  const box = pictureBox(id);
  ctx.drawImage(img, x - box.width / 2, y - box.height, box.width, box.height);
}
