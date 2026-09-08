import { getBalance } from '../core/Balance.ts';
import type { Game } from '../core/Game.ts';
import type { Camera } from './Camera.ts';
import { roundRectPath } from './UiKit.ts';

/**
 * Дорога-стержень: тёмный край, тело и кладка отдельными камнями.
 *
 * Три слоя, а не один: заливка одним цветом на четверть экрана читается как
 * дыра в текстуре. Тёмный край отделяет дорогу от травы, кладка даёт
 * поверхности масштаб — по камню видно, какого размера игрок.
 */
export function drawRoad(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { scenery, palette } = getBalance();
  const paths = game.scenery.roadPaths.filter((path) => path.points.length >= 2);
  if (paths.length === 0) return;

  // Край и тело — одной ломаной, разной толщиной: два прохода дешевле, чем
  // считать контур полосы, и на изломах не расходятся. Края всех ниток идут
  // раньше всех тел: иначе ответвление кладёт свой тёмный кант поверх стержня
  // и развилка выглядит перечёркнутой.
  for (const path of paths) {
    strokeSpine(ctx, path.points, path.width + scenery.roadEdgeWidth * 2, palette.roadEdge);
  }
  for (const path of paths) strokeSpine(ctx, path.points, path.width, palette.roadDirt);
  drawStones(ctx, game, camera);
}

function strokeSpine(
  ctx: CanvasRenderingContext2D,
  points: readonly { x: number; y: number }[],
  width: number,
  color: string,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
  ctx.stroke();
  ctx.restore();
}

/** Кладка. За экраном не рисуем: камней на дорогу через весь остров — сотни. */
function drawStones(ctx: CanvasRenderingContext2D, game: Game, camera: Camera): void {
  const { palette, scenery } = getBalance();
  const tones = [palette.roadStoneLight, palette.roadStoneDark];

  ctx.save();
  for (const stone of game.scenery.roadStones) {
    if (!camera.isVisible(stone.x, stone.y, stone.size, stone.size)) continue;
    ctx.save();
    ctx.translate(stone.x, stone.y);
    ctx.rotate(stone.angle);
    ctx.fillStyle = tones[stone.tone] ?? tones[0]!;
    // Обводка цветом самой дороги: камни кладутся внахлёст, и без шва они
    // сливаются в одно светлое пятно вместо кладки.
    ctx.strokeStyle = palette.roadDirt;
    ctx.lineWidth = scenery.roadStoneSeam;
    ctx.lineJoin = 'round';
    const half = stone.size / 2;
    roundRectPath(ctx, -half, -half, stone.size, stone.size, half * 0.55);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
