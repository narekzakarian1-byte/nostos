import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { DecorPlacement } from '../world/Scenery.ts';
import { currentIslandId } from '../world/Island.ts';
import type { Camera } from './Camera.ts';
import { groundImage } from './GroundPaint.ts';
import { paintProp } from './props/Prop.ts';
import { drawRoad } from './Road.ts';
import { sprites } from './Sprites.ts';
import { ui } from './UiKit.ts';

/**
 * Земля и дорога — всё, что лежит ПЛАШМЯ и не зависит от боя.
 *
 * Рамки по краю острова здесь больше нет. Серая обводка прямоугольника
 * читалась как отсутствующая текстура, а край мира и без неё объяснён:
 * дальше песок, пена и вода (ui/GroundPaint.ts). Стена, за которую не пускают
 * игрока, стоит по кромке песка — там, где и должна.
 * Вынесено из Renderer.ts, чтобы тот остался про порядок слоёв и про фигуры,
 * а не про замощение текстур.
 *
 * Декор сюда не входит: проп стоит вертикально и должен перекрывать игрока,
 * когда тот за ним. Пропы рисует WorldLayer.ts вперемешку с фигурами, по
 * глубине.
 */
export function drawTerrain(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  drawGround(ctx, game, camera);
  drawGrass(ctx, game, camera);
  drawRoad(ctx, game, camera);
}

/**
 * Земля целиком: море, берег, материалы зон и пятна света — одной запечённой
 * картинкой (GroundPaint.ts).
 *
 * Раньше здесь мостился один тайл травы на весь мир, а всё за стеной
 * закрашивалось тёмно-синим bgFar. От этого «Галечный берег» и «Площадь у
 * храма» выглядели одинаково, а край острова читался дырой в мире.
 *
 * Море под картинкой заливается отдельно и по всему виду: камера намеренно не
 * ограничена краями мира (Camera.follow), поэтому за печатью остаётся видимая
 * полоса, и она обязана быть водой, а не пустотой.
 */
function drawGround(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { juice, palette } = getBalance();
  // Запас на тряску камеры, чтобы её амплитуда не обнажала край заливки.
  const pad = juice.screenshakeCrit;
  ctx.fillStyle = palette.seaDeep;
  ctx.fillRect(
    camera.x - pad, camera.y - pad,
    camera.viewWidth + pad * 2, camera.viewHeight + pad * 2,
  );

  const baked = groundImage({
    width: game.worldWidth,
    height: game.worldHeight,
    ground: game.scenery.ground,
    islandId: currentIslandId(),
  });
  if (baked) {
    ctx.drawImage(baked.canvas, baked.x, baked.y, baked.width, baked.height);
    return;
  }

  // Печать ещё не готова (текстура травы не загрузилась) — прежняя заливка,
  // чтобы первый кадр не вышел синим.
  const pattern = sprites.pattern(ctx, 'ground-grass');
  ctx.fillStyle = pattern ?? ui().colors.ground;
  ctx.fillRect(0, 0, game.worldWidth, game.worldHeight);
}

/**
 * Пучки травы поверх земли. Две короткие черты под наклоном: этого хватает,
 * чтобы земля не читалась пустой, а стоит это один путь на пучок.
 *
 * И они качаются. Это единственное движение на всём экране, когда игрок стоит
 * на месте, и стоит оно одного синуса на пучок — а без него поле читается
 * ковролином, по которому ходит человек.
 *
 * Два тона, зелёный и сухой, и два прохода на них. Одинаково зелёные пучки
 * складывались в равномерную россыпь галочек — глаз ловил повтор раньше, чем
 * успевал увидеть землю под ними.
 */
function drawGrass(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { scenery, palette, ambient } = getBalance();
  // Волна ветра идёт ПО МИРУ, а не одинаково у всех пучков: при общей фазе
  // поле дёргается целиком, как одна картинка, и это заметнее неподвижности.
  const wave = (x: number, y: number) => ambient.grassSwayAmount * Math.sin(
    game.elapsed * ambient.grassSwayHz * Math.PI * 2
    + (x + y) / ambient.grassWaveUnits,
  );
  ctx.save();
  ctx.lineWidth = scenery.grassWidth;
  ctx.lineCap = 'round';
  for (const dry of [false, true]) {
    ctx.strokeStyle = dry ? palette.grassTuftDry : palette.grassTuft;
    ctx.beginPath();
    for (const tuft of game.scenery.grass) {
      if (tuft.dry !== dry) continue;
      if (!camera.isVisible(tuft.x, tuft.y, tuft.size, tuft.size)) continue;
      const h = tuft.size;
      const lean = tuft.lean + wave(tuft.x, tuft.y);
      ctx.moveTo(tuft.x, tuft.y);
      ctx.lineTo(tuft.x + Math.sin(lean) * h * 0.5, tuft.y - h);
      ctx.moveTo(tuft.x, tuft.y);
      ctx.lineTo(tuft.x + Math.sin(lean + 1) * h * 0.45, tuft.y - h * 0.7);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Один проп. Раскиданы они детерминированно по сиду в Scenery.ts, не руками,
 * а порядок отрисовки задаёт WorldLayer.ts.
 *
 * prop.y — точка КАСАНИЯ земли. Раньше её приходилось подгонять полем anchor
 * под каждую картинку: у ворот в 90 единиц промах на полкартинки увёл бы тень
 * вбок, а сами ворота повисли бы в воздухе. Теперь подгонять нечего — точка
 * касания это начало координат модели по построению, и якорь считает фабрика
 * (art/blender/lib/render.py).
 */
export function drawProp(ctx: CanvasRenderingContext2D, prop: DecorPlacement): void {
  paintProp(ctx, prop);
}
