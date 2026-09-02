import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { DecorPlacement } from '../world/Scenery.ts';
import { currentIslandId } from '../world/Island.ts';
import { SPRITES } from './AssetManifest.ts';
import type { Camera } from './Camera.ts';
import { islandBorder } from './IslandArt.ts';
import { paintProp } from './props/Prop.ts';
import { drawRoad } from './Road.ts';
import { sprites } from './Sprites.ts';
import { ui } from './UiKit.ts';

/**
 * Земля, край острова и дорога — всё, что лежит ПЛАШМЯ и не зависит от боя.
 * Вынесено из Renderer.ts, чтобы тот остался про порядок слоёв и про фигуры,
 * а не про замощение текстур.
 *
 * Декор сюда не входит: проп стоит вертикально и должен перекрывать игрока,
 * когда тот за ним. Пропы рисует WorldLayer.ts вперемешку с фигурами, по
 * глубине.
 */
export function drawTerrain(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  drawGround(ctx, camera);
  drawGrass(ctx, game, camera);
  drawOutside(ctx, game, camera);
  drawBorder(ctx, game);
  drawRoad(ctx, game, camera);
}

/** Земля мостится паттерном из спрайта; нет файла — плоская заливка. */
function drawGround(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const { juice } = getBalance();
  // Запас на тряску камеры, чтобы её амплитуда не обнажала край заливки.
  const pad = juice.screenshakeCrit;
  const pattern = sprites.pattern(ctx, 'ground-base');
  ctx.fillStyle = pattern ?? ui().colors.ground;
  ctx.fillRect(
    camera.x - pad,
    camera.y - pad,
    camera.viewWidth + pad * 2,
    camera.viewHeight + pad * 2,
  );
}

/**
 * Пучки травы поверх заливки. Две короткие черты под наклоном: этого хватает,
 * чтобы земля перестала читаться пустой, а стоит это один путь на пучок.
 */
function drawGrass(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { scenery, palette } = getBalance();
  ctx.save();
  ctx.strokeStyle = palette.grassTuft;
  ctx.lineWidth = scenery.grassWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const tuft of game.scenery.grass) {
    if (!camera.isVisible(tuft.x, tuft.y, tuft.size, tuft.size)) continue;
    const h = tuft.size;
    ctx.moveTo(tuft.x, tuft.y);
    ctx.lineTo(tuft.x + Math.sin(tuft.lean) * h * 0.5, tuft.y - h);
    ctx.moveTo(tuft.x, tuft.y);
    ctx.lineTo(tuft.x + Math.sin(tuft.lean + 1) * h * 0.45, tuft.y - h * 0.7);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Всё, что за рамкой острова, закрывается наглухо. Полупрозрачная вуаль
 * оставляла под собой ту же траву с теми же пучками, и край читался как
 * недорисованный тайл, а не как конец суши. Ходить туда игрок больше не
 * может (Player.move), значит и показывать там нечего.
 */
function drawOutside(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { palette } = getBalance();
  const b = game.scenery.border;
  const left = camera.x;
  const top = camera.y;
  const right = left + camera.viewWidth;
  const bottom = top + camera.viewHeight;

  ctx.save();
  ctx.fillStyle = palette.bgFar;
  if (top < b.y) ctx.fillRect(left, top, right - left, Math.min(b.y, bottom) - top);
  const bEnd = b.y + b.height;
  if (bottom > bEnd) {
    ctx.fillRect(left, Math.max(bEnd, top), right - left, bottom - Math.max(bEnd, top));
  }
  const innerTop = Math.max(top, b.y);
  const innerBottom = Math.min(bottom, bEnd);
  if (innerBottom > innerTop) {
    if (left < b.x) ctx.fillRect(left, innerTop, Math.min(b.x, right) - left, innerBottom - innerTop);
    const bRight = b.x + b.width;
    if (right > bRight) {
      ctx.fillRect(Math.max(bRight, left), innerTop, right - Math.max(bRight, left), innerBottom - innerTop);
    }
  }
  ctx.restore();
}

/** Граница острова. Спрайт есть — тайлю плашками вдоль каждой стороны прямоугольника. */
function drawBorder(ctx: CanvasRenderingContext2D, game: Game): void {
  const { scenery, palette } = getBalance();
  const b = game.scenery.border;

  const id = islandBorder(currentIslandId());
  const img = sprites.get(id);
  if (!img) {
    ctx.strokeStyle = palette.borderStone;
    ctx.lineWidth = scenery.borderThickness;
    ctx.strokeRect(b.x, b.y, b.width, b.height);
    return;
  }

  const def = SPRITES[id];
  const thickness = scenery.borderThickness * 4; // текстура толще линии-заглушки, иначе не читается
  const tileW = (def.width / def.height) * thickness;
  const x2 = b.x + b.width;
  const y2 = b.y + b.height;
  tileSegment(ctx, img, b.x, b.y, x2, b.y, thickness, tileW);
  tileSegment(ctx, img, b.x, y2, x2, y2, thickness, tileW);
  tileSegment(ctx, img, b.x, b.y, b.x, y2, thickness, tileW);
  tileSegment(ctx, img, x2, b.y, x2, y2, thickness, tileW);
}

/**
 * Один проп. Раскиданы они детерминированно по сиду в Scenery.ts, не руками,
 * а порядок отрисовки задаёт WorldLayer.ts.
 *
 * prop.y — точка КАСАНИЯ земли. Раньше её приходилось подгонять полем anchor
 * под каждую картинку: у ворот в 90 единиц промах на полкартинки увёл бы тень
 * вбок, а сами ворота повисли бы в воздухе. Теперь подгонять нечего — точка
 * касания это начало координат модели по построению (ui/props/Bake.ts).
 */
export function drawProp(ctx: CanvasRenderingContext2D, prop: DecorPlacement): void {
  paintProp(ctx, prop.id, prop.x, prop.y);
}

/** Повторяет спрайт плашками вдоль прямого отрезка — общий приём для дороги и границы. */
function tileSegment(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x1: number, y1: number, x2: number, y2: number,
  thickness: number,
  tileWidth: number,
): void {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(angle);
  for (let x = 0; x < length; x += tileWidth) {
    ctx.drawImage(img, x, -thickness / 2, tileWidth, thickness);
  }
  ctx.restore();
}
