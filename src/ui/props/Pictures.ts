import { getBalance } from '../../core/Balance.ts';
import { SPRITES, type SpriteId } from '../AssetManifest.ts';
import { sprites } from '../Sprites.ts';
import { optics, rgba } from './Optics.ts';

/**
 * Пропы-картинки. В отличие от геометрических (Models.ts) у них нет ни модели,
 * ни запекания: это готовый PNG, который ставится подошвой на землю.
 *
 * Путей два. Отрендеренный в Blender проп есть в props.rendered: у него точный
 * якорь и парный файл тени, и рисуется он вместе с ней. Старой картинке из
 * Draw Things движок отброшенную тень не рисует — формы её силуэта он не
 * знает; ей достаётся контактное затемнение под подошвой (drawContact ниже),
 * иначе проп висит над травой.
 *
 * Раньше здесь стояло, что «внутри острова ракурс и свет сходятся сами, потому
 * что пропы генерятся пачкой под один промпт». Это оказалось неправдой:
 * диффузионная модель не может держать камеру и свет, у неё их нет, и разъезд
 * виден в игре глазом (ART_PIPELINE.md §1.1). Ради этого и заведён рендер.
 *
 * Тип собирается через Extract из SpriteId, а не отдельным списком строк: так
 * пропа, которого нет в манифесте, не существует и на уровне типа —
 * промахнуться именем нельзя.
 */
export type PicturePropId = Extract<
  SpriteId,
  'prop-vine-trellis' | 'prop-wine-press' | 'prop-cart-broken'
  | 'prop-palisade-burnt' | 'prop-hut-burnt' | 'prop-ship' | 'prop-temple'
  | 'prop-column' | 'prop-column-broken' | 'prop-ruin-gate'
  | 'prop-rock' | 'prop-rubble'
>;

/**
 * Метрики пропа, отрендеренного в Blender. Их нет — проп рисуется прежним
 * путём, низом картинки в точку касания. Так рендеры и генерации живут рядом,
 * и переводить остров на новый арт можно по одному объекту.
 */
function rendered(id: PicturePropId) {
  return getBalance().props.rendered?.[id];
}

const PICTURE_PROPS: readonly PicturePropId[] = [
  'prop-vine-trellis', 'prop-wine-press', 'prop-cart-broken',
  'prop-palisade-burnt', 'prop-hut-burnt', 'prop-ship', 'prop-temple',
  'prop-column', 'prop-column-broken', 'prop-ruin-gate',
  'prop-rock', 'prop-rubble',
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
  // У рендера габарит картинки известен точно и включает тень: он посчитан из
  // модели, а не выведен из пропорции файла.
  const meta = rendered(id);
  if (meta) return { width: size.value * meta.boxW, height: size.value * meta.boxH };

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
  const box = pictureBox(id);
  const meta = rendered(id);
  if (meta) {
    // Отрендеренный проп: сначала настоящая отброшенная тень, потом тело, оба
    // по одному якорю. Контактное пятно ему не рисуется — своя тень у него уже
    // есть, и второе затемнение поверх неё читается грязью.
    const left = x - meta.anchorX * box.width;
    const top = y - meta.anchorY * box.height;
    const shadow = sprites.get(`${id}-shadow` as SpriteId);
    if (shadow) ctx.drawImage(shadow, left, top, box.width, box.height);
    const body = sprites.get(id);
    if (body) ctx.drawImage(body, left, top, box.width, box.height);
    return;
  }

  const img = sprites.get(id);
  if (!img) return;
  drawContact(ctx, x, y, box.width);
  ctx.drawImage(img, x - box.width / 2, y - box.height, box.width, box.height);
}

/**
 * Контактное затемнение под подошвой — то же, что у геометрических пропов
 * (Solid.ts), тем же цветом и теми же числами.
 *
 * Отброшенную тень движок картинкам по-прежнему не рисует: её форму он не
 * знает, а силуэт PNG для этого пришлось бы разбирать по альфе в каждом кадре.
 * Но без контактного пятна проп висит над травой — корабль и хижина читались
 * как наклейки, и это било сильнее, чем отсутствие сноса тени.
 *
 * Генератор иногда всё же оставляет внутри PNG бледное серое пятно, хотя
 * преамбула запрещает тень прямым текстом (ISLANDS.md §1.4). Оно серое, а
 * земля зелёная, поэтому читается грязью; контактное затемнение своим цветом
 * (props.shadowColor) перекрывает его снизу и сводит к общему свету острова.
 */
function drawContact(ctx: CanvasRenderingContext2D, x: number, y: number, width: number): void {
  const p = getBalance().props;
  const o = optics();
  const foot = width * p.contactSpread;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, o.groundSquash * p.contactSquash);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, foot);
  grad.addColorStop(0, rgba(p.shadowColor, p.contactAlpha));
  grad.addColorStop(1, rgba(p.shadowColor, 0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, foot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
