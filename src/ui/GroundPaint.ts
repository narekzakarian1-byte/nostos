import { getBalance } from '../core/Balance.ts';
import type { Ground, GroundPoint, ShadeBlob } from '../world/Ground.ts';
import { paintPatches } from './GroundPatches.ts';
import { rgba } from './props/Optics.ts';
import { sprites } from './Sprites.ts';

/**
 * Земля печётся один раз в холст размером с мир и дальше кладётся на экран
 * одним drawImage.
 *
 * Так можно позволить себе то, чего в кадре не позволишь: сотню клякс
 * материала, тысячи крапин, два десятка пятен света. Ни одно из них не
 * меняется от кадра к кадру — считать их шестьдесят раз в секунду незачем.
 * Ровно та же сделка, что у фабрики ассетов: посчитать один раз то, что не
 * меняется от кадра к кадру.
 *
 * Печать идёт в единицах мира: пиксель на единицу. Это та же плотность, что
 * давал прежний тайл (base.png в 512 пикселей кроет 512 единиц), так что
 * резкость не теряется.
 */
export interface BakedGround {
  readonly canvas: HTMLCanvasElement;
  /** Куда класть левый верхний угол картинки в единицах мира. Отрицателен:
   *  печать шире мира на поля, иначе берег обрезается краем холста. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface Cached extends BakedGround {
  readonly key: string;
}

let cache: Cached | null = null;

export interface GroundWorld {
  readonly width: number;
  readonly height: number;
  readonly ground: Ground;
  readonly islandId: string;
}

/**
 * Готовая земля мира. Пока текстура травы не загрузилась, печь нельзя:
 * запёкшийся без неё холст остался бы плоской заливкой навсегда. В этом
 * случае возвращаем null, и Terrain.ts рисует прежнюю заливку до следующего
 * кадра.
 */
export function groundImage(world: GroundWorld): BakedGround | null {
  const key = `${world.islandId}|${Math.round(world.width)}x${Math.round(world.height)}`;
  if (cache?.key === key) return cache;
  if (!sprites.get('ground-grass')) return null;

  const made = bake(world);
  if (!made) return null;
  cache = { ...made, key };
  return cache;
}

/** Сброс кэша. Нужен дев-панели и тестам: остров сменился — земля другая. */
export function forgetGround(): void {
  cache = null;
}

/**
 * Поле вокруг мира. Берег уходит наружу от стены, а стена стоит в шестнадцати
 * единицах от края мира — без поля берег обрезался бы краем холста, и остров
 * снова кончался бы по линейке.
 */
export function bakeMargin(): number {
  const { coast } = getBalance().terrain;
  return coast.outsetUnits * (1 + coast.waviness) + coast.shoreWidth + coast.surfWidth * 3;
}

function bake(world: GroundWorld): BakedGround | null {
  const { terrain } = getBalance();
  const margin = bakeMargin();
  const width = world.width + margin * 2;
  const height = world.height + margin * 2;

  // Потолок в пикселях: на большом окне мир вырастает, и холст в пиксель на
  // единицу мог бы уйти в десятки мегабайт. Не влезли — печём мельче.
  const wanted = terrain.bakePxPerUnit;
  const area = width * height * wanted * wanted;
  const px = area > terrain.bakeMaxPixels
    ? wanted * Math.sqrt(terrain.bakeMaxPixels / area)
    : wanted;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width * px));
  canvas.height = Math.max(1, Math.ceil(height * px));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Дальше всё рисуется в единицах мира со сдвигом на поле: масштаб задан один
  // раз здесь, и ни одна из функций ниже про плотность печати не знает.
  ctx.setTransform(px, 0, 0, px, margin * px, margin * px);
  const box = { x: -margin, y: -margin, width, height };

  paintSea(ctx, world, box);
  paintLand(ctx, world, box);
  ctx.save();
  // Материал и крапины — только по суше: за берегом им делать нечего.
  clipLoop(ctx, world.ground.coast);
  paintPatches(ctx, world.ground.patches);
  ctx.restore();
  // Песчаная кромка и пена кладутся ПОСЛЕ материала зон. Зона доходит до края
  // мира, её кляксы выпускаются наружу — положи кромку раньше, и плита
  // храмовой площади затопила бы пляж, до которого от неё полсотни единиц.
  paintShore(ctx, world);
  paintShade(ctx, world.ground.blobs);

  return { canvas, x: -margin, y: -margin, width, height };
}

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Море до горизонта: за берегом мир не кончается, он продолжается водой. */
function paintSea(ctx: CanvasRenderingContext2D, world: GroundWorld, box: Box): void {
  const { palette, terrain } = getBalance();
  ctx.fillStyle = palette.seaDeep;
  ctx.fillRect(box.x, box.y, box.width, box.height);

  // Мелководье вдоль берега: два ореола наружу от контура суши. Без них берег
  // обрывается в глубокую воду одной линией и читается вырезанным.
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = palette.sea;
  ctx.lineWidth = terrain.coast.surfWidth * 5;
  strokeLoop(ctx, world.ground.coast);
  ctx.strokeStyle = palette.seaShallow;
  ctx.lineWidth = terrain.coast.surfWidth * 2;
  strokeLoop(ctx, world.ground.coast);
  ctx.restore();
}

/** Суша: трава острова по всему контуру берега. Материал зон ляжет поверх. */
function paintLand(ctx: CanvasRenderingContext2D, world: GroundWorld, box: Box): void {
  ctx.save();
  clipLoop(ctx, world.ground.coast);
  const pattern = grassPattern(ctx);
  ctx.fillStyle = pattern ?? getBalance().terrain.materials.grass[0];
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.restore();
}

/**
 * Песчаная кромка и пена.
 *
 * Песок кладётся обводкой контура изнутри, а не отдельной фигурой: обводка
 * повторяет все изгибы берега точно, а построенный по нормалям внутренний
 * контур на вогнутых местах сам себя пересекает.
 */
function paintShore(ctx: CanvasRenderingContext2D, world: GroundWorld): void {
  const { palette, terrain } = getBalance();
  const loop = world.ground.coast;

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.save();
  clipLoop(ctx, loop);
  ctx.strokeStyle = palette.shore;
  ctx.lineWidth = terrain.coast.shoreWidth * 2;
  strokeLoop(ctx, loop);
  ctx.restore();

  // Пена по самой кромке: узкая светлая линия, по которой берег и читается
  // берегом, а не сменой цвета земли.
  ctx.strokeStyle = palette.foam;
  ctx.lineWidth = terrain.coast.foamWidth;
  strokeLoop(ctx, loop);
  ctx.restore();
}

/** Крупные пятна света и тени поверх всей земли, включая воду. */
function paintShade(ctx: CanvasRenderingContext2D, blobs: readonly ShadeBlob[]): void {
  const { shade } = getBalance().terrain;
  for (const blob of blobs) {
    const color = blob.dark ? shade.darkColor : shade.lightColor;
    const alpha = blob.dark ? shade.darkAlpha : shade.lightAlpha;
    ctx.save();
    ctx.translate(blob.x, blob.y);
    ctx.scale(1, blob.ry / blob.rx);
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, blob.rx);
    grad.addColorStop(0, rgba(color, alpha));
    grad.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, blob.rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Паттерн травы в координатах печати. Свой у каждого холста — общий кэш
 *  Sprites.pattern привязан к чужому контексту. */
function grassPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const img = sprites.get('ground-grass');
  return img ? ctx.createPattern(img, 'repeat') : null;
}

function loopPath(ctx: CanvasRenderingContext2D, points: readonly GroundPoint[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.closePath();
}

function strokeLoop(ctx: CanvasRenderingContext2D, points: readonly GroundPoint[]): void {
  if (points.length < 3) return;
  loopPath(ctx, points);
  ctx.stroke();
}

function clipLoop(ctx: CanvasRenderingContext2D, points: readonly GroundPoint[]): void {
  if (points.length < 3) return;
  loopPath(ctx, points);
  ctx.clip();
}
