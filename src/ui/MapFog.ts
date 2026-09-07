import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import { bakeMargin } from './GroundPaint.ts';
import { coastPath, drawMapGround, type Project } from './MapZones.ts';
import { ui } from './UiKit.ts';

/**
 * Подложка карты: море, остров и туман поверх него.
 *
 * Отдельно от Minimap.ts, который отвечает за кадрирование и за значки. Здесь
 * ровно то, что карта говорит о ЗЕМЛЕ, и это единственное место, где решается,
 * какой формы остров на карте.
 */

/** Море во весь кадр карты, поверх — сам остров с материалом зон. */
export function drawMapLand(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
  scale: number,
): void {
  const margin = bakeMargin();
  const origin = project(-margin, -margin);
  ctx.fillStyle = getBalance().palette.seaDeep;
  ctx.fillRect(
    origin.x, origin.y,
    (game.worldWidth + margin * 2) * scale, (game.worldHeight + margin * 2) * scale,
  );
  drawMapGround(ctx, game, project);
}

/**
 * Туман одним путём и одной заливкой: клетки кладутся внахлёст на пиксель, и
 * раздельные fillRect копили альфу на стыках — карта выглядела миллиметровкой,
 * а не туманом.
 *
 * Обрезается контуром берега. Сетка тумана кроет прямоугольник мира, и без
 * обрезки внутри острова стоял тёмный прямоугольник с прямыми углами — карта
 * читалась таблицей ничуть не меньше, чем с рамками зон. Море при этом чистое:
 * неизвестен остров, а не вода вокруг него.
 */
export function drawMapFog(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
  scale: number,
): void {
  const { minimap } = getBalance();
  const { fog } = game;
  const cell = fog.cellSize * scale + 1;

  ctx.save();
  if (coastPath(ctx, game, project)) ctx.clip();
  ctx.fillStyle = ui().colors.veil;
  ctx.globalAlpha = minimap.fogAlpha;

  ctx.beginPath();
  for (let row = 0; row < fog.rows; row++) {
    for (let col = 0; col < fog.cols; col++) {
      if (fog.isVisitedCell(col, row)) continue;
      const p = project(col * fog.cellSize, row * fog.cellSize);
      ctx.rect(p.x, p.y, cell, cell);
    }
  }
  addOuterBand(ctx, game, project);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Полоса суши за краем мира. Сетка тумана кроет только прямоугольник мира, а
 * берег выходит за него на поле печати — без этих четырёх полос по острову шёл
 * ровный прямоугольный срез уже открытой земли.
 *
 * Кладётся в тот же путь, что и клетки: заливка по нулевому правилу не копит
 * альфу на нахлёсте, поэтому шва между полосой и сеткой не будет.
 */
function addOuterBand(
  ctx: CanvasRenderingContext2D,
  game: Game,
  project: Project,
): void {
  const band = bakeMargin();
  const outer = project(-band, -band);
  const inner = project(0, 0);
  const far = project(game.worldWidth + band, game.worldHeight + band);
  const edge = project(game.worldWidth, game.worldHeight);
  ctx.rect(outer.x, outer.y, far.x - outer.x, inner.y - outer.y);
  ctx.rect(outer.x, edge.y, far.x - outer.x, far.y - edge.y);
  ctx.rect(outer.x, inner.y, inner.x - outer.x, edge.y - inner.y);
  ctx.rect(edge.x, inner.y, far.x - edge.x, edge.y - inner.y);
}
